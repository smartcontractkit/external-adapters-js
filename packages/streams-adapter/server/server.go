package server

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"strconv"
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
	Success    bool   `json:"success"`
	Error      string `json:"error,omitempty"`
	StatusCode int    `json:"statusCode,omitempty"`
}

// ErrorResponseData represents the structure of error responses
type ErrorResponseData struct {
	Error struct {
		Name    string `json:"name"`
		Message string `json:"message"`
	} `json:"error"`
	StatusCode int `json:"statusCode,omitempty"`
}

// ObservationErrorResponse is returned when the cached observation has Success=false
type ObservationErrorResponse struct {
	ErrorMessage string          `json:"errorMessage"`
	Timestamps   json.RawMessage `json:"timestamps"`
	StatusCode   int             `json:"statusCode,omitempty"`
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
	config           *config.Config
	cache            *cache.Cache
	logger           *slog.Logger
	server           *http.Server
	metricsServer    *http.Server
	router           *gin.Engine
	httpClient       *http.Client
	metrics          *appMetrics.Metrics
	metricsForwarder *appMetrics.Forwarder
	ctx              context.Context
	cancel           context.CancelFunc
}

// New creates a new HTTP server
func New(cfg *config.Config, cache *cache.Cache, logger *slog.Logger) *Server {
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

	jsMetricsURL := buildMetricsURL(cfg)
	metricsForwarder := appMetrics.NewForwarder(jsMetricsURL, time.Duration(cfg.MetricsForwardTimeoutSeconds)*time.Second)

	server := &Server{
		config:           cfg,
		cache:            cache,
		logger:           logger.With("component", "server"),
		router:           router,
		httpClient:       httpClient,
		metrics:          metrics,
		metricsForwarder: metricsForwarder,
		ctx:              ctx,
		cancel:           cancel,
	}

	server.setupRoutes()

	return server
}

// setupRoutes configures the HTTP routes
func (s *Server) setupRoutes() {
	group := s.router.Group(s.config.EABaseUrl)
	// Health check endpoint
	group.GET("/health", s.healthHandler)
	// Cache debug endpoint
	group.GET("/cache", s.cacheHandler)
	// Main adapter endpoint
	group.POST("", s.adapterHandler)
}

// Start starts the HTTP server
func (s *Server) Start() error {
	// Start a separate HTTP server for Prometheus metrics on port 9080.
	// The combined gatherer merges Go-native metrics with forwarded JS
	// adapter metrics (excluding families already tracked in Go).
	gatherer := appMetrics.CombinedGatherer(s.metricsForwarder)
	metricsMux := http.NewServeMux()
	metricsMux.Handle(s.config.EABaseUrl+"/metrics", promhttp.HandlerFor(gatherer, promhttp.HandlerOpts{}))

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
	// 2a. Shutdown main server
	if s.server != nil {
		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := s.server.Shutdown(ctx); err != nil {
			return err
		}
	}

	// 2b. Shutdown metrics server
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
		Key                 string                 `json:"key"`
		Status              types.CacheItemStatus  `json:"status"`
		TransformedKey      string                 `json:"transformedKey,omitempty"`
		AdapterKey          string                 `json:"adapterKey,omitempty"`
		Timestamp           time.Time              `json:"timestamp"`
		Observation         *types.Observation     `json:"observation,omitempty"`
		OriginalRequestData map[string]interface{} `json:"originalRequestData,omitempty"`
	}
	entries := make([]entry, 0, len(items))
	for key, item := range items {
		entries = append(entries, entry{
			Key:                 key,
			Status:              item.Status,
			TransformedKey:      item.TransformedKey,
			AdapterKey:          item.OriginalAdapterKey,
			Timestamp:           item.Timestamp,
			Observation:         item.Observation,
			OriginalRequestData: item.OriginalRequestData,
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
			Success:    false,
			Error:      fmt.Sprintf("Invalid request format: %v", err),
			StatusCode: http.StatusBadRequest,
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
		errorResp.StatusCode = http.StatusInternalServerError

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
		errorResp.StatusCode = http.StatusInternalServerError

		c.JSON(http.StatusInternalServerError, errorResp)
		return
	}

	// Try the cache: if the item exists and is active, serve it.
	// If it exists but is still new/learned, a subscription is already in
	// progress — return 504 without starting another goroutine.
	if item := s.cache.Get(rawCacheKey); item != nil {
		if item.Status == types.StatusActive && item.Observation != nil {
			respondWithObservation(c, item)
			return
		}
		// Fall through to 504 below.
	} else {
		// First request for this key — create the item and start polling.
		if s.cache.SetNew(rawCacheKey, reqData.Data) {
			s.logger.Debug("Initiating new subscription", "requestParams", rawParams, "rawCacheKey", rawCacheKey)
			go func(key string, params types.RequestParams, originalData map[string]interface{}) {
				endpoint := params["endpoint"]
				retryInterval := time.Duration(s.config.FeedIDPollIntervalSeconds) * time.Second
				maxRetries := int(s.config.FeedIDMaxRetries)

				for i := 0; i < maxRetries; i++ {
					if i > 0 {
						time.Sleep(retryInterval)
					}
					feedID, ok := s.queryAdapterForFeedID(originalData)
					if ok {
						transformedKey, err := helpers.TransformedKeyFromFeedID(feedID, endpoint)
						if err != nil {
							s.logger.Error("Failed to compute transformed key from feedId", "feedId", feedID, "error", err)
							break
						}
						s.cache.SetTransformedKey(key, transformedKey)
						s.logger.Debug("Learned key mapping from feedId", "rawKey", key, "transformedKey", transformedKey)
						break
					}
				}
			}(rawCacheKey, rawParams, reqData.Data)
		}
	}

	// Get error response from pool
	errorResp := errorResponsePool.Get().(*ErrorResponseData)
	defer errorResponsePool.Put(errorResp)

	errorResp.Error.Name = "AdapterError"
	errorResp.Error.Message = "The EA has not received any values from the Data Provider for the requested data yet. Retry after a short delay, and if the problem persists raise this issue in the relevant channels."
	errorResp.StatusCode = http.StatusGatewayTimeout

	c.JSON(http.StatusGatewayTimeout, errorResp)
}

// respondWithObservation writes the observation to the response. Returns 200 for
// successful observations and 502 with an error payload for failed ones.
func respondWithObservation(c *gin.Context, item *types.CacheItem) {
	obs := item.Observation
	if obs.Success {
		if item.RequiresInverse {
			inverted, err := invertObservation(obs)
			if err != nil {
				c.JSON(http.StatusBadGateway, ObservationErrorResponse{
					ErrorMessage: err.Error(),
					Timestamps:   obs.Timestamps,
					StatusCode:   http.StatusBadGateway,
				})
				return
			}
			obs = inverted
		}
		c.JSON(http.StatusOK, obs)
		return
	}
	c.JSON(http.StatusBadGateway, ObservationErrorResponse{
		ErrorMessage: obs.Error,
		Timestamps:   obs.Timestamps,
		StatusCode:   http.StatusBadGateway,
	})
}

func invertObservation(obs *types.Observation) (*types.Observation, error) {
	inverted := *obs

	data, err := invertResultInObject(obs.Data)
	if err != nil {
		return nil, err
	}
	inverted.Data = data

	if len(obs.Result) > 0 {
		result, err := invertRawNumber(obs.Result)
		if err != nil {
			return nil, err
		}
		inverted.Result = result
	}

	return &inverted, nil
}

func invertResultInObject(raw json.RawMessage) (json.RawMessage, error) {
	var data map[string]interface{}
	if err := json.Unmarshal(raw, &data); err != nil {
		return nil, fmt.Errorf("unable to invert observation result: %w", err)
	}

	result, ok := data["result"]
	if !ok {
		return nil, fmt.Errorf("unable to invert observation result: missing result")
	}
	num, err := numberFromInterface(result)
	if err != nil {
		return nil, err
	}
	if num == 0 {
		return nil, fmt.Errorf("unable to invert observation result: result is zero")
	}

	data["result"] = 1 / num
	return json.Marshal(data)
}

func invertRawNumber(raw json.RawMessage) (json.RawMessage, error) {
	var num float64
	if err := json.Unmarshal(raw, &num); err != nil {
		return nil, fmt.Errorf("unable to invert top-level result: %w", err)
	}
	if num == 0 {
		return nil, fmt.Errorf("unable to invert top-level result: result is zero")
	}
	return json.Marshal(1 / num)
}

func numberFromInterface(value interface{}) (float64, error) {
	switch v := value.(type) {
	case float64:
		return v, nil
	case json.Number:
		return v.Float64()
	case string:
		num, err := strconv.ParseFloat(v, 64)
		if err != nil {
			return 0, fmt.Errorf("unable to invert observation result: result is not numeric")
		}
		return num, nil
	default:
		return 0, fmt.Errorf("unable to invert observation result: result is not numeric")
	}
}

// postToAdapter marshals data as {"data": ...} and POSTs it to the JS adapter.
// The caller is responsible for closing resp.Body.
func (s *Server) postToAdapter(data interface{}) (*http.Response, error) {
	body, err := json.Marshal(map[string]interface{}{"data": data})
	if err != nil {
		return nil, fmt.Errorf("marshal: %w", err)
	}
	url := fmt.Sprintf("http://%s:%s%s", s.config.EAHost, s.config.EAPort, s.config.EABaseUrl)
	return s.httpClient.Post(url, "application/json", bytes.NewBuffer(body))
}

// subscribeToAsset sends a subscription request to the JS adapter.
// The data parameter is sent as the "data" field in the POST body.
// It accepts either the original client request data (map[string]interface{},
// preserving overrides) or stripped RequestParams (map[string]string).
func (s *Server) subscribeToAsset(data interface{}) {
	resp, err := s.postToAdapter(data)
	if err != nil {
		s.logger.Error("Failed to send subscribe request", "error", err)
		return
	}
	defer resp.Body.Close()

	if s.config.LogLevel == "debug" {
		s.logger.Debug("Subscribe request sent successfully", "status", resp.StatusCode)
	}
}

// queryAdapterForFeedID sends a request to the JS adapter and returns the
// feedId from meta.metrics.feedId on a 200 response. Returns empty string and
// false if the adapter returns a non-200 status or feedId is absent.
func (s *Server) queryAdapterForFeedID(data interface{}) (feedID string, ok bool) {
	resp, err := s.postToAdapter(data)
	if err != nil {
		s.logger.Error("Failed to query JS adapter for feedId", "error", err)
		return "", false
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode != http.StatusGatewayTimeout {
			s.logger.Warn("Unexpected status from JS adapter during feedId poll", "status", resp.StatusCode)
		}
		return "", false
	}

	var result struct {
		Meta struct {
			Metrics struct {
				FeedId string `json:"feedId"`
			} `json:"metrics"`
		} `json:"meta"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		s.logger.Error("Failed to decode JS adapter response for feedId", "error", err)
		return "", false
	}

	if result.Meta.Metrics.FeedId == "" {
		return "", false
	}

	return result.Meta.Metrics.FeedId, true
}

// resubscribeLoop periodically resubscribes to all assets in the cache.
func (s *Server) resubscribeLoop() {
	cleanupInterval := time.Duration(s.config.CacheCleanupIntervalSeconds) * time.Second
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

// resubscribeAllAssets resubscribes to all active assets in the cache.
// Uses OriginalRequestData (stored at first subscription time) when available so
// that overrides and the exact original params are preserved, avoiding case
// mismatches that can cause the JS adapter to re-subscribe with a different
// symbol and have that subscription rejected.
func (s *Server) resubscribeAllAssets() {
	items := s.cache.Items()

	for _, item := range items {
		if item.Status != types.StatusActive {
			continue
		}
		if item.OriginalRequestData == nil {
			s.logger.Warn("No original request data for active cache item, skipping resubscribe", "key", item.OriginalAdapterKey)
			continue
		}
		go func(p interface{}) {
			s.subscribeToAsset(p)
		}(item.OriginalRequestData)
	}
}

// buildMetricsURL constructs the JS adapter metrics scrape URL.
// When MetricsUseBaseUrl is true, EABaseUrl is prepended to /metrics.
func buildMetricsURL(cfg *config.Config) string {
	metricsPath := "/metrics"
	if cfg.MetricsUseBaseUrl {
		metricsPath = cfg.EABaseUrl + "/metrics"
	}
	return fmt.Sprintf("http://%s:%s%s", cfg.EAHost, cfg.EAMetricsPort, metricsPath)
}
