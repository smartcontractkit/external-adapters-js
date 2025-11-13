package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	_ "net/http/pprof"
	"runtime"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/prometheus/client_golang/prometheus/promhttp"

	cache "streams-adapter/cache"
	types "streams-adapter/common"
	config "streams-adapter/config"
	"streams-adapter/helpers"
	appMetrics "streams-adapter/metrics"
	"streams-adapter/middleware"
)

// RequestData represents the structure of incoming request data
type RequestData struct {
	Data struct {
		Endpoint string `json:"endpoint" binding:"required"`
		From     string `json:"from" binding:"required"`
		To       string `json:"to" binding:"required"`
	} `json:"data" binding:"required"`
}

// ResponseData represents the structure of the response
type ResponseData struct {
	Data struct {
		Result interface{} `json:"result"`
	} `json:"data"`
	Success bool   `json:"success"`
	Error   string `json:"error,omitempty"`
}

// ErrorResponseData represents the structure of error responses
type ErrorResponseData struct {
	Error struct {
		Name    string `json:"name"`
		Message string `json:"message"`
	} `json:"error"`
}

// Object pools for reducing memory allocations
var (
	requestDataPool = sync.Pool{
		New: func() interface{} {
			return &RequestData{}
		},
	}

	errorResponsePool = sync.Pool{
		New: func() interface{} {
			return &ErrorResponseData{}
		},
	}
)

// Server represents the HTTP server
type Server struct {
	config              *config.Config
	cache               *cache.Cache
	logger              *slog.Logger
	server              *http.Server
	router              *gin.Engine
	httpClient          *http.Client
	subscriptionTracker sync.Map
	metrics             *appMetrics.Metrics
}

// New creates a new HTTP server
func New(cfg *config.Config, cache *cache.Cache, logger *slog.Logger) *Server {
	// Set Gin mode based on log level
	if cfg.LogLevel == "debug" {
		gin.SetMode(gin.DebugMode)
	} else {
		gin.SetMode(gin.ReleaseMode)
	}

	// Create router without default middleware
	router := gin.New()

	// Initialize metrics
	metrics := appMetrics.NewMetrics()

	// Always add recovery middleware for panic handling
	router.Use(gin.Recovery())

	// Add metrics middleware to track all HTTP requests
	router.Use(middleware.MetricsMiddleware(metrics))

	// Only add logger middleware in debug mode
	if cfg.LogLevel == "debug" {
		router.Use(gin.Logger())
	}

	// Create HTTP client with connection pooling and reuse
	// This prevents ephemeral port exhaustion in high-traffic scenarios
	// Longer timeout for subscribe requests which may take time to process
	httpClient := &http.Client{
		Timeout: 30 * time.Second,
		Transport: &http.Transport{
			MaxIdleConns:        100,
			MaxIdleConnsPerHost: 100,
			IdleConnTimeout:     90 * time.Second,
			DisableKeepAlives:   false,
			// Reduce connection establishment time
			DialContext: (&net.Dialer{
				Timeout:   2 * time.Second,
				KeepAlive: 30 * time.Second,
			}).DialContext,
		},
	}

	server := &Server{
		config:     cfg,
		cache:      cache,
		logger:     logger.With("component", "server"),
		router:     router,
		httpClient: httpClient,
		metrics:    metrics,
	}

	server.setupRoutes()

	return server
}

// setupRoutes configures the HTTP routes
func (s *Server) setupRoutes() {
	// Health check endpoint
	s.router.GET("/health", s.healthHandler)

	// Main adapter endpoint
	s.router.POST("/", s.adapterHandler)

	// Prometheus metrics endpoint
	s.router.GET("/metrics", gin.WrapH(promhttp.Handler()))

	// Debug endpoints (for debugging and profiling)
	s.router.GET("/debug/cache/stats", s.cacheStatsHandler)
	s.router.GET("/debug/metrics", s.metricsHandler)

	// pprof endpoints (standard Go profiling)
	// Access these with: curl http://localhost:8080/debug/pprof/heap > heap.out
	s.router.GET("/debug/pprof/*any", gin.WrapH(http.DefaultServeMux))
}

// Start starts the HTTP server
func (s *Server) Start() error {
	s.server = &http.Server{
		Addr:           ":" + s.config.HTTPPort,
		Handler:        s.router,
		ReadTimeout:    1 * time.Second,
		WriteTimeout:   1 * time.Second,
		IdleTimeout:    3 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	s.logger.Info("Starting HTTP server", "port", s.config.HTTPPort)

	if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("failed to start HTTP server: %w", err)
	}

	return nil
}

// Stop gracefully stops the HTTP server
func (s *Server) Stop() error {
	if s.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		return s.server.Shutdown(ctx)
	}
	return nil
}

// healthHandler handles health check requests
func (s *Server) healthHandler(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"status": "healthy",
		"time":   time.Now().UTC(),
	})
}

// adapterHandler handles the main adapter requests
func (s *Server) adapterHandler(c *gin.Context) {
	// Get request object from pool
	reqData := requestDataPool.Get().(*RequestData)
	defer requestDataPool.Put(reqData)
	if err := c.ShouldBindJSON(reqData); err != nil {
		c.JSON(http.StatusBadRequest, ResponseData{
			Success: false,
			Error:   fmt.Sprintf("Invalid request format: %v", err),
		})
		return
	}

	// Extract asset pair data from request
	assetPair := types.AssetPair{
		Base:     reqData.Data.From,
		Quote:    reqData.Data.To,
		Endpoint: reqData.Data.Endpoint,
	}

	// Set asset_pair for metrics tracking
	middleware.SetAssetPair(c, assetPair.Base, assetPair.Quote, assetPair.Endpoint)

	// Check if pre-marshaled JSON response exists in cache
	cachedResponse := s.cache.Get(assetPair)

	// Check if observation exists in cache
	if cachedResponse == nil {
		subscriptionKey := helpers.CalculateCacheKey(assetPair)

		// Only subscribe if we're not already subscribing to this asset pair
		// This prevents thundering herd of duplicate subscription requests
		if _, alreadySubscribing := s.subscriptionTracker.LoadOrStore(subscriptionKey, true); !alreadySubscribing {
			if s.config.LogLevel == "debug" {
				s.logger.Debug("Initiating new subscription", "key", subscriptionKey)
			}
			go func(key string, pair types.AssetPair) {
				s.subscribeToAsset(pair)
				// Remove from tracker after subscription attempt completes
				// Allow retries after 10 seconds if data still not available
				time.Sleep(10 * time.Second)
				s.subscriptionTracker.Delete(key)
			}(subscriptionKey, assetPair)
		} else if s.config.LogLevel == "debug" {
			s.logger.Debug("Subscription already in progress, skipping", "key", subscriptionKey)
		}

		// Get error response from pool
		errorResp := errorResponsePool.Get().(*ErrorResponseData)
		defer errorResponsePool.Put(errorResp)

		errorResp.Error.Name = "AdapterError"
		errorResp.Error.Message = "The EA has not received any values from the Data Provider for the requested data yet. Retry after a short delay, and if the problem persists raise this issue in the relevant channels."

		c.JSON(http.StatusGatewayTimeout, errorResp)
		return
	}

	// Return the observation as JSON
	c.JSON(http.StatusOK, cachedResponse)
}

// subscribeToAsset sends a subscription request for the given asset pair
func (s *Server) subscribeToAsset(assetPair types.AssetPair) {
	subscribeBody := map[string]interface{}{
		"data": map[string]string{
			"endpoint": assetPair.Endpoint,
			"from":     assetPair.Base,
			"to":       assetPair.Quote,
		},
	}

	jsonBody, err := json.Marshal(subscribeBody)
	if err != nil {
		s.logger.Error("Failed to marshal subscribe request", "error", err)
		return
	}

	internalUrl := fmt.Sprintf("http://%s:%s", s.config.EAHost, s.config.EAPort)

	// Use the reusable HTTP client to avoid port exhaustion
	resp, err := s.httpClient.Post(internalUrl, "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		s.logger.Error("Failed to send subscribe request", "error", err, "url", internalUrl)
		return
	}
	defer resp.Body.Close()

	if s.config.LogLevel == "debug" {
		s.logger.Debug("Subscribe request sent successfully", "status", resp.StatusCode, "url", internalUrl)
	}
}

// cacheStatsHandler provides cache statistics for debugging
func (s *Server) cacheStatsHandler(c *gin.Context) {
	keys := s.cache.Keys()

	stats := gin.H{
		"size":      s.cache.Size(),
		"keys":      keys,
		"timestamp": time.Now().UTC(),
	}

	c.JSON(http.StatusOK, stats)
}

// metricsHandler provides overall system metrics
func (s *Server) metricsHandler(c *gin.Context) {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)

	metrics := gin.H{
		"timestamp": time.Now().UTC(),
		"memory": gin.H{
			"alloc_mb":         float64(m.Alloc) / 1024 / 1024,
			"total_alloc_mb":   float64(m.TotalAlloc) / 1024 / 1024,
			"sys_mb":           float64(m.Sys) / 1024 / 1024,
			"heap_alloc_mb":    float64(m.HeapAlloc) / 1024 / 1024,
			"heap_sys_mb":      float64(m.HeapSys) / 1024 / 1024,
			"heap_idle_mb":     float64(m.HeapIdle) / 1024 / 1024,
			"heap_inuse_mb":    float64(m.HeapInuse) / 1024 / 1024,
			"heap_released_mb": float64(m.HeapReleased) / 1024 / 1024,
			"heap_objects":     m.HeapObjects,
			"num_gc":           m.NumGC,
			"gc_cpu_fraction":  m.GCCPUFraction,
		},
		"goroutines": runtime.NumGoroutine(),
		"cache_size": s.cache.Size(),
	}

	c.JSON(http.StatusOK, metrics)
}
