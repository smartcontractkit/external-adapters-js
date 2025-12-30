package main

import (
	"fmt"
	"log"
	"log/slog"
	"net/http"
	"os"
	"time"

	"streams-adapter/cache"
	"streams-adapter/config"
	"streams-adapter/helpers"
	"streams-adapter/redcon"
	"streams-adapter/server"
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
		MaxSize:         cfg.CacheMaxSize,
		TTL:             time.Duration(cfg.CacheTTLMinutes) * time.Minute,
		CleanupInterval: time.Duration(cfg.CacheCleanupInterval) * time.Minute,
	})
	defer appCache.Stop()

	// Wait for EA server to be ready before starting
	waitForEAServer(cfg, logger)

	// Initialize HTTP server
	httpServer := server.New(cfg, appCache, logger)
	defer httpServer.Stop()

	// Initialize Redcon server
	redconServer := redcon.New(redcon.Config{
		Addr:   ":" + cfg.RedconPort,
		Cache:  appCache,
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

	// Start Redcon server in a goroutine
	go func() {
		if err := redconServer.Start(); err != nil {
			logger.Error("Redcon server failed", "error", err)
			errChan <- err
		}
	}()

	if err := <-errChan; err != nil {
		log.Fatal(err)
	}
}
