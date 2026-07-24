package main

import (
	"fmt"
	"log"
	"log/slog"
	"net"
	"net/http"
	"os"
	"time"

	"github.com/soheilhy/cmux"
	"google.golang.org/grpc"

	"streams-adapter/cache"
	"streams-adapter/config"
	pb "streams-adapter/gen/streams/v1"
	"streams-adapter/helpers"
	"streams-adapter/redcon"
	"streams-adapter/server"
	"streams-adapter/transmitter"
)

// waitForEAServer waits for the EA server to be ready before proceeding
func waitForEAServer(cfg *config.Config, logger *slog.Logger) {
	eaURL := fmt.Sprintf("http://%s:%s%s/health", cfg.EAHost, cfg.EAPort, cfg.EABaseUrl)
	maxWaitTime := 60 * time.Second
	checkInterval := 500 * time.Millisecond
	startTime := time.Now()

	logger.Info("Waiting for EA server to be ready", "url", eaURL, "maxWaitTime", maxWaitTime)

	client := &http.Client{
		Timeout: 2 * time.Second,
	}

	timer := time.After(maxWaitTime)
	ticker := time.NewTicker(checkInterval)
	defer ticker.Stop()

	for {
		select {
		case <-timer:
			log.Fatal("EA server did not become ready within timeout", "timeout", maxWaitTime)
		case <-ticker.C:
			// Try to connect to the EA server health endpoint
			resp, err := client.Get(eaURL)
			if err == nil && resp.StatusCode == http.StatusOK {
				resp.Body.Close()
				logger.Info("EA server is ready", "elapsed", time.Since(startTime))
				return
			}
			if resp != nil {
				resp.Body.Close()
			}
		}
	}
}

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	// Initialize endpoint/parameter alias indices from generated JSON configuration.
	if err := helpers.InitAliasIndex(cfg.AdapterName, "endpoint_aliases.json"); err != nil {
		log.Fatal("Failed to initialize alias index", "error", err)
	}

	appCache := cache.New(cache.Config{
		TTL:             time.Duration(cfg.CacheTTLMinutes) * time.Minute,
		CleanupInterval: time.Duration(cfg.CacheCleanupIntervalSeconds) * time.Second,
	})
	defer appCache.Stop()

	// Create the gRPC publisher (fanout to subscribed clients)
	pub := transmitter.NewPublisher()

	// Wait for EA server to be ready before starting
	waitForEAServer(cfg, logger)

	// Initialize HTTP server
	httpServer := server.New(cfg, appCache, logger)
	defer httpServer.Stop()

	// Initialize Redcon server
	redconServer := redcon.New(redcon.Config{
		Addr:      ":" + cfg.RedconPort,
		Cache:     appCache,
		Publisher: pub,
		Logger:    logger,
	})

	// Create error channel for goroutine failures
	errChan := make(chan error, 1)

	// Open a single TCP listener on the HTTP port; cmux routes connections to
	// either the gRPC handler (HTTP/2 with content-type: application/grpc)
	// or the HTTP/1.x gin handler.
	lis, err := net.Listen("tcp", ":"+cfg.HTTPPort)
	if err != nil {
		log.Fatalf("failed to listen on port %s: %v", cfg.HTTPPort, err)
	}
	mux := cmux.New(lis)
	grpcL := mux.MatchWithWriters(
		cmux.HTTP2MatchHeaderFieldSendSettings("content-type", "application/grpc"),
	)
	httpL := mux.Match(cmux.Any())

	// Start gRPC transmitter server
	grpcServer := grpc.NewServer()
	refreshTimeout := time.Duration(cfg.SubscriptionRefreshTimeoutSeconds) * time.Second
	pb.RegisterStreamServiceServer(grpcServer, transmitter.NewStreamTransmitter(
		pub,
		logger,
		httpServer.ResolveSubscription,
		httpServer.EnsureSubscription,
		refreshTimeout,
	))
	go func() {
		logger.Info("gRPC transmitter listening (shared port)", "port", cfg.HTTPPort)
		if err := grpcServer.Serve(grpcL); err != nil {
			logger.Error("gRPC server failed", "error", err)
			errChan <- err
		}
	}()

	// Start HTTP server on the cmux HTTP sub-listener
	go func() {
		if err := httpServer.StartOnListener(httpL); err != nil {
			logger.Error("HTTP server failed", "error", err)
			errChan <- err
		}
	}()

	// Start Redcon server in a goroutine
	go func() {
		if err := redconServer.Start(); err != nil {
			logger.Error("Redcon server failed", "error", err)
			errChan <- err
		}
	}()

	// Start cmux dispatcher
	go func() {
		if err := mux.Serve(); err != nil {
			logger.Error("cmux failed", "error", err)
			errChan <- err
		}
	}()

	if err := <-errChan; err != nil {
		log.Fatal(err)
	}
}
