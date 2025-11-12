package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	cache "streams-adapter/cache"
	config "streams-adapter/config"
	redcon "streams-adapter/redcon"
	server "streams-adapter/server"
)

// waitForEAServer waits for the EA server to be ready before proceeding
func waitForEAServer(cfg *config.Config, logger *slog.Logger) {
	eaURL := fmt.Sprintf("http://%s:%s/health", cfg.EAHost, cfg.EAPort)
	maxWaitTime := 60 * time.Second
	checkInterval := 500 * time.Millisecond
	startTime := time.Now()

	logger.Info("Waiting for EA server to be ready", "url", eaURL, "maxWaitTime", maxWaitTime)

	client := &http.Client{
		Timeout: 2 * time.Second,
	}

	for {
		// Check if we've exceeded the maximum wait time
		if time.Since(startTime) > maxWaitTime {
			logger.Error("EA server did not become ready within timeout", "timeout", maxWaitTime)
			log.Fatal("EA server startup timeout")
		}

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

		// Wait before the next check
		time.Sleep(checkInterval)
	}
}

func main() {
	cfg := config.Load()
	logger := slog.New(slog.NewTextHandler(os.Stdout, nil))

	cache := cache.New(cache.Config{
		MaxSize:         cfg.CacheMaxSize,
		TTL:             time.Duration(cfg.CacheTTLMinutes) * time.Minute,
		CleanupInterval: time.Duration(cfg.CacheCleanupInterval) * time.Minute,
	})
	defer cache.Stop()

	// Wait for EA server to be ready before starting
	waitForEAServer(cfg, logger)

	// Initialize HTTP server
	httpServer := server.New(cfg, cache, logger)
	defer httpServer.Stop()

	// Initialize Redcon server
	redconServer := redcon.New(redcon.Config{
		Addr:   ":" + cfg.RedconPort,
		Cache:  cache,
		Logger: logger,
	})

	// Create error channel for goroutine failures
	errChan := make(chan error, 1)

	// Start HTTP server in a goroutine
	go func() {
		if err := httpServer.Start(); err != nil {
			logger.Error("HTTP server failed", "error", err)
			errChan <- err
		}
	}()

	// Start Redis server (blocking)
	if err := redconServer.Start(); err != nil {
		log.Fatal(err)
	}
}
