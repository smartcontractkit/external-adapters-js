package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"net/http"
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
	Data map[string]interface{} `json:"data" binding:"required"`
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
	metricsServer       *http.Server
	router              *gin.Engine
	httpClient          *http.Client
	subscriptionTracker sync.Map
	metrics             *appMetrics.Metrics
	metricsForwarder    *appMetrics.Forwarder
	keyMapper           *helpers.KeyMapper
	ctx                 context.Context
	cancel              context.CancelFunc
}

// New creates a new HTTP server
func New(cfg *config.Config, cache *cache.Cache, logger *slog.Logger, keyMapper *helpers.KeyMapper) *Server {
	ctx, cancel := context.WithCancel(context.Background())
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

	jsMetricsURL := fmt.Sprintf("http://%s:%s/metrics", cfg.EAHost, cfg.EAMetricsPort)
	metricsForwarder := appMetrics.NewForwarder(jsMetricsURL)

	server := &Server{
		config:           cfg,
		cache:            cache,
		logger:           logger.With("component", "server"),
		router:           router,
		httpClient:       httpClient,
		metrics:          metrics,
		metricsForwarder: metricsForwarder,
		keyMapper:        keyMapper,
		ctx:              ctx,
		cancel:           cancel,
	}

	server.setupRoutes()

	return server
}

// setupRoutes configures the HTTP routes
func (s *Server) setupRoutes() {
	// Health check endpoint
	s.router.GET("/health", s.healthHandler)
	// Cache debug endpoint
	s.router.GET("/cache", s.cacheHandler)
	// Main adapter endpoint
	s.router.POST("/", s.adapterHandler)
}

// Start starts the HTTP server
func (s *Server) Start() error {
	// Start a separate HTTP server for Prometheus metrics on port 9080.
	// The combined gatherer merges Go-native metrics with forwarded JS
	// adapter metrics (excluding families already tracked in Go).
	gatherer := appMetrics.NewCombinedGatherer(s.metricsForwarder, s.logger)
	metricsMux := http.NewServeMux()
	metricsMux.Handle("/metrics", promhttp.HandlerFor(gatherer, promhttp.HandlerOpts{}))

	s.metricsServer = &http.Server{
		Addr:    ":" + s.config.GoMetricsPort,
		Handler: metricsMux,
	}

	go func() {
		s.logger.Info("Starting metrics server", "port", "9080")
		if err := s.metricsServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.Error("Metrics server error", "error", err)
		}
	}()

	s.server = &http.Server{
		Addr:           ":" + s.config.HTTPPort,
		Handler:        s.router,
		ReadTimeout:    1 * time.Second,
		WriteTimeout:   1 * time.Second,
		IdleTimeout:    3 * time.Second,
		MaxHeaderBytes: 1 << 20,
	}

	go s.resubscribeLoop()

	s.logger.Info("Starting HTTP server", "port", s.config.HTTPPort)

	if err := s.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		return fmt.Errorf("failed to start HTTP server: %w", err)
	}

	return nil
}

// Stop gracefully stops the HTTP server
func (s *Server) Stop() error {
	// 1. Stop background goroutines first
	if s.cancel != nil {
		s.cancel()
	}

	// 2. Shutdown HTTP servers
	if s.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := s.server.Shutdown(ctx); err != nil {
			return err
		}
	}

	// 3. Shutdown metrics server
	if s.metricsServer != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := s.metricsServer.Shutdown(ctx); err != nil {
			return err
		}
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

// cacheHandler returns all current cache entries for debugging.
func (s *Server) cacheHandler(c *gin.Context) {
	items := s.cache.Items()

	type entry struct {
		Key         string             `json:"key"`
		AdapterKey  string             `json:"adapterKey"`
		Timestamp   time.Time          `json:"timestamp"`
		Observation *types.Observation `json:"observation"`
	}

	entries := make([]entry, 0, len(items))
	for key, item := range items {
		entries = append(entries, entry{
			Key:         key,
			AdapterKey:  item.OriginalAdapterKey,
			Timestamp:   item.Timestamp,
			Observation: item.Observation,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"items": entries,
		"count": len(entries),
	})
}

// adapterHandler handles the main adapter requests.
// It uses the KeyMapper to translate raw client params into the JS adapter's
// transformed cache key, then looks up the observation by that key.
func (s *Server) adapterHandler(c *gin.Context) {
	// Get request object from pool
	reqData := requestDataPool.Get().(*RequestData)
	defer requestDataPool.Put(reqData)
	reqData.Data = nil
	if err := c.ShouldBindJSON(reqData); err != nil {
		c.JSON(http.StatusBadRequest, ResponseData{
			Success: false,
			Error:   fmt.Sprintf("Invalid request format: %v", err),
		})
		return
	}

	// Resolve endpoint alias and build raw cache key params.
	rawParams, err := helpers.BuildCacheKeyParams(reqData.Data)
	if err != nil {
		s.logger.Error("Failed to canonicalize request params", "error", err, "requestData", reqData.Data)

		// If we cannot canonicalize the request (e.g. unknown/unsupported endpoint),
		// do not attempt to use the cache or subscribe and return a 500 to the caller.
		errorResp := errorResponsePool.Get().(*ErrorResponseData)
		defer errorResponsePool.Put(errorResp)

		errorResp.Error.Name = "AdapterError"
		errorResp.Error.Message = "Unable to subscribe to an asset pair with the the requested data"

		c.JSON(http.StatusInternalServerError, errorResp)
		return
	}

	// Set request params for metrics tracking
	middleware.SetRequestParams(c, rawParams)

	rawCacheKey, err := helpers.CalculateCacheKey(rawParams)
	if err != nil {
		s.logger.Error("Failed to calculate cache key", "error", err, "requestParams", rawParams)
		// If we cannot calculate a subscription key, do not attempt to subscribe
		// and return a 500 to the caller.
		errorResp := errorResponsePool.Get().(*ErrorResponseData)
		defer errorResponsePool.Put(errorResp)

		errorResp.Error.Name = "AdapterError"
		errorResp.Error.Message = "Unable to subscribe to an asset pair with the the requested data"

		c.JSON(http.StatusInternalServerError, errorResp)
		return
	}

	// Try the mapper: raw key → transformed key → cache lookup by transformed key.
	if transformedKey, ok := s.keyMapper.Get(rawCacheKey); ok {
		if item := s.cache.Get(transformedKey); item != nil && item.Observation != nil {
			c.JSON(http.StatusOK, item.Observation)
			return
		}
	}

	// Fallback: try direct lookup by raw key (handles the common case where
	// raw key == transformed key, i.e. no adapter-level requestTransform).
	if item := s.cache.Get(rawCacheKey); item != nil && item.Observation != nil {
		c.JSON(http.StatusOK, item.Observation)
		return
	}

	// Cache miss — fire subscription concurrently, then learn mapping serially.
	if _, alreadySubscribing := s.subscriptionTracker.LoadOrStore(rawCacheKey, true); !alreadySubscribing {
		s.logger.Debug("Initiating new subscription", "requestParams", rawParams, "rawCacheKey", rawCacheKey)
		go func(key string, params types.RequestParams, originalData map[string]interface{}) {
			// Phase 1: Fire subscription immediately with original data
			// (includes overrides). Gets the subscription queued at the JS
			// adapter ASAP without waiting for the per-endpoint learning lock.
			s.subscribeToAsset(originalData)

			// Phase 2: Learn the raw→transformed cache key mapping.
			// Serialized per endpoint via KeyMapper's existing mutex.
			// The re-subscribe is fast because the JS adapter already has
			// the subscription active from phase 1.
			s.keyMapper.SubscribeAndLearn(params["endpoint"], key, func() {
				s.subscribeToAsset(originalData)
			})

			// Remove from tracker after subscription attempt completes.
			// Allow retries after delay if data still not available.
			time.Sleep(time.Duration(s.config.SubscriptionRetryDelaySeconds) * time.Second)
			s.subscriptionTracker.Delete(key)
		}(rawCacheKey, rawParams, reqData.Data)
	} else if s.config.LogLevel == "debug" {
		s.logger.Debug("Subscription already in progress, skipping", "key", rawCacheKey)
	}

	// Get error response from pool
	errorResp := errorResponsePool.Get().(*ErrorResponseData)
	defer errorResponsePool.Put(errorResp)

	errorResp.Error.Name = "AdapterError"
	errorResp.Error.Message = "The EA has not received any values from the Data Provider for the requested data yet. Retry after a short delay, and if the problem persists raise this issue in the relevant channels."

	c.JSON(http.StatusGatewayTimeout, errorResp)
}

// subscribeToAsset sends a subscription request to the JS adapter.
// The data parameter is sent as the "data" field in the POST body.
// It accepts either the original client request data (map[string]interface{},
// preserving overrides) or stripped RequestParams (map[string]string).
func (s *Server) subscribeToAsset(data interface{}) {
	subscribeBody := map[string]interface{}{
		"data": data,
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

// resubscribe loop periodically resubscribes to all assets in the cache
func (s *Server) resubscribeLoop() {
	cleanupInterval := time.Duration(s.config.CacheCleanupInterval) * time.Minute
	ticker := time.NewTicker(cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-s.ctx.Done():
			return
		case <-ticker.C:
			s.resubscribeAllAssets()
		}
	}
}

// resubscribeAllAssets resubscribes to all assets in the cache.
// Parses request params from the OriginalAdapterKey stored on each cache item.
func (s *Server) resubscribeAllAssets() {
	items := s.cache.Items()

	for _, item := range items {
		params, err := helpers.RequestParamsFromKey(item.OriginalAdapterKey)
		if err != nil {
			s.logger.Debug("Failed to parse params from adapter key", "key", item.OriginalAdapterKey, "error", err)
			continue
		}
		go s.subscribeToAsset(params)
	}
}
