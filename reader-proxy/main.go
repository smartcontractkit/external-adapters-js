package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func main() {
	// Load configuration
	config := LoadConfig()

	// Initialize cache
	cache := NewCache(config.CacheTTL, config.CacheCleanupInterval)
	defer cache.Stop()

	// Initialize proxy
	proxy := NewProxy(config, cache)

	// Setup HTTP server
	mux := http.NewServeMux()
	mux.HandleFunc("/", proxy.HandleRequest)
	mux.HandleFunc("/health", handleHealth)
	mux.HandleFunc("/metrics", proxy.HandleMetrics)

	server := &http.Server{
		Addr:         fmt.Sprintf(":%d", config.Port),
		Handler:      mux,
		ReadTimeout:  config.ReadTimeout,
		WriteTimeout: config.WriteTimeout,
		IdleTimeout:  config.IdleTimeout,
	}

	// Start server in goroutine
	go func() {
		log.Printf("Starting reader-proxy on port %d", config.Port)
		log.Printf("Cache TTL: %v, Cleanup Interval: %v", config.CacheTTL, config.CacheCleanupInterval)
		log.Printf("Downstream target: %s", config.DownstreamURL)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("Server failed: %v", err)
		}
	}()

	// Graceful shutdown
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down server...")
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		log.Fatalf("Server forced to shutdown: %v", err)
	}

	log.Println("Server exited")
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ok"}`))
}

