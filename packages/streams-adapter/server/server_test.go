package server

import (
	"encoding/json"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	cache "streams-adapter/cache"
	types "streams-adapter/common"
	config "streams-adapter/config"
	"streams-adapter/helpers"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/require"
)

// Shared test server to avoid duplicate prometheus metric registration.
var testSrv *Server
var testCache *cache.Cache

func TestMain(m *testing.M) {
	// Write a minimal alias config for the "test" adapter.
	aliasJSON := `{
		"adapters": {
			"test": {
				"endpoints": {
					"crypto": {
						"aliases": ["crypto"],
						"params": {
							"base": {"aliases": ["from"], "required": true},
							"quote": {"aliases": ["to"], "required": true}
						}
					}
				}
			}
		}
	}`
	tmpFile, err := os.CreateTemp("", "endpoint_aliases_*.json")
	if err != nil {
		panic(err)
	}
	defer os.Remove(tmpFile.Name())
	if _, err := tmpFile.WriteString(aliasJSON); err != nil {
		panic(err)
	}
	tmpFile.Close()

	if err := helpers.InitAliasIndex("test", tmpFile.Name()); err != nil {
		panic(err)
	}

	cfg := &config.Config{
		HTTPPort:             "0",
		EAPort:               "0",
		EAHost:               "localhost",
		RedconPort:           "0",
		GoMetricsPort:        "0",
		CacheTTLMinutes:      5,
		CacheCleanupInterval: 60,
		LogLevel:             "info",
		AdapterName:          "test",
	}

	testCache = cache.New(cache.Config{
		TTL:             5 * time.Minute,
		CleanupInterval: 10 * time.Minute,
	})

	testSrv = New(cfg, testCache, slog.Default())

	os.Exit(m.Run())
}

// setCache drives a raw key through the full item lifecycle so tests can
// pre-populate the cache with an active observation without needing a JS adapter.
// Use rawKey == transformedKey for adapters without parameter transformation.
func setCache(t *testing.T, params types.RequestParams, obs *types.Observation, originalAdapterKey string) {
	t.Helper()
	rawKey, err := helpers.CalculateCacheKey(params)
	require.NoError(t, err)
	testCache.SetNew(rawKey)
	testCache.SetTransformedKey(rawKey, rawKey)
	testCache.SetObservation(rawKey, obs, time.Now(), originalAdapterKey)
}

func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	testSrv.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code)

	var body map[string]interface{}
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &body))
	require.Equal(t, "healthy", body["status"])
}

func TestAdapterHandler_BadRequest(t *testing.T) {

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"invalid"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	testSrv.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAdapterHandler_CacheHit(t *testing.T) {
	// Pre-populate cache with params that match the handler's raw key.
	// The test alias config has "crypto" as canonical endpoint name.
	params := types.RequestParams{"endpoint": "crypto", "base": "ETH", "quote": "USD"}
	obs := &types.Observation{
		Data:    json.RawMessage(`{"result":1234}`),
		Success: true,
	}
	setCache(t, params, obs, "test-key")

	body := `{"data":{"endpoint":"crypto","base":"ETH","quote":"USD"}}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	testSrv.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusOK, w.Code, "body: %s", w.Body.String())

	var resp types.Observation
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	require.Equal(t, true, resp.Success)
}

func TestAdapterHandler_CacheHit_FailedObservation(t *testing.T) {
	params := types.RequestParams{"endpoint": "crypto", "base": "FOO", "quote": "BAR"}
	obs := &types.Observation{
		Data:       nil,
		Timestamps: json.RawMessage(`{"providerDataStreamEstablishedUnixMs":1000,"providerDataReceivedUnixMs":2000}`),
		Success:    false,
		Error:      "Bid price: 1.23 or Ask price: 4.56 for FOO is invalid.",
	}
	setCache(t, params, obs, "test-key-fail")

	body := `{"data":{"endpoint":"crypto","base":"FOO","quote":"BAR"}}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	testSrv.router.ServeHTTP(w, req)

	require.Equal(t, http.StatusBadGateway, w.Code, "body: %s", w.Body.String())

	var resp ObservationErrorResponse
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &resp))
	require.Equal(t, "Bid price: 1.23 or Ask price: 4.56 for FOO is invalid.", resp.ErrorMessage)
	require.NotEmpty(t, resp.Timestamps)

	var ts map[string]interface{}
	require.NoError(t, json.Unmarshal(resp.Timestamps, &ts))
	require.Equal(t, float64(1000), ts["providerDataStreamEstablishedUnixMs"])
	require.Equal(t, float64(2000), ts["providerDataReceivedUnixMs"])
}

func TestAdapterHandler_CacheMiss(t *testing.T) {
	// Spin up a fake EA backend so the subscribe POST doesn't fail
	backend := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	}))
	defer backend.Close()

	// Point the subscribe client at our fake backend
	origHost, origPort := testSrv.config.EAHost, testSrv.config.EAPort
	parts := strings.SplitN(strings.TrimPrefix(backend.URL, "http://"), ":", 2)
	testSrv.config.EAHost = parts[0]
	testSrv.config.EAPort = parts[1]
	defer func() {
		testSrv.config.EAHost = origHost
		testSrv.config.EAPort = origPort
	}()

	body := `{"data":{"endpoint":"crypto","base":"BTC","quote":"USD"}}`
	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	testSrv.router.ServeHTTP(w, req)

	// First request with empty cache should return 504 with error message
	require.Equal(t, http.StatusGatewayTimeout, w.Code, "body: %s", w.Body.String())

	var errResp ErrorResponseData
	require.NoError(t, json.Unmarshal(w.Body.Bytes(), &errResp))
	require.Equal(t, "AdapterError", errResp.Error.Name)
}

func TestBuildMetricsURL_NoBaseUrl(t *testing.T) {
	cfg := &config.Config{
		EAHost:              "localhost",
		EAMetricsPort:       "9081",
		EABaseUrl:           "",
		MetricsUseBaseUrl: false,
	}
	got := buildMetricsURL(cfg)
	require.Equal(t, "http://localhost:9081/metrics", got)
}

func TestBuildMetricsURL_WithBaseUrl(t *testing.T) {
	cfg := &config.Config{
		EAHost:              "localhost",
		EAMetricsPort:       "9081",
		EABaseUrl:           "/blocksize-capital-llo-exp",
		MetricsUseBaseUrl: true,
	}
	got := buildMetricsURL(cfg)
	require.Equal(t, "http://localhost:9081/blocksize-capital-llo-exp/metrics", got)
}

func TestBuildMetricsURL_WithBaseUrlTrailingSlash(t *testing.T) {
	// Config normalizes trailing slashes at load time; EABaseUrl is always stored without one.
	cfg := &config.Config{
		EAHost:              "localhost",
		EAMetricsPort:       "9081",
		EABaseUrl:           "/blocksize-capital-llo-exp",
		MetricsUseBaseUrl: true,
	}
	got := buildMetricsURL(cfg)
	require.Equal(t, "http://localhost:9081/blocksize-capital-llo-exp/metrics", got)
}

func TestBuildMetricsURL_WithBaseUrlDefault_UseBaseUrl(t *testing.T) {
	// Config normalizes "/" to "" (empty string) at load time.
	cfg := &config.Config{
		EAHost:              "localhost",
		EAMetricsPort:       "9081",
		EABaseUrl:           "",
		MetricsUseBaseUrl: true,
	}
	got := buildMetricsURL(cfg)
	require.Equal(t, "http://localhost:9081/metrics", got)
}

func newServerWithBaseURL(t *testing.T, baseURL string) *Server {
	t.Helper()
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(gin.Recovery())
	srv := &Server{
		config: &config.Config{EABaseUrl: baseURL, LogLevel: "info"},
		router: router,
	}
	srv.setupRoutes()
	return srv
}

func TestSetupRoutes_DefaultBaseUrl_RoutesAccessible(t *testing.T) {
	srv := newServerWithBaseURL(t, "/")

	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	srv.router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
}

func TestSetupRoutes_CustomBaseUrl_RoutesAccessible(t *testing.T) {
	srv := newServerWithBaseURL(t, "/blocksize-capital-llo-exp")

	req := httptest.NewRequest(http.MethodGet, "/blocksize-capital-llo-exp/health", nil)
	w := httptest.NewRecorder()
	srv.router.ServeHTTP(w, req)
	require.Equal(t, http.StatusOK, w.Code)
}

func TestSetupRoutes_CustomBaseUrl_OldPathsReturn404(t *testing.T) {
	srv := newServerWithBaseURL(t, "/blocksize-capital-llo-exp")

	for _, path := range []string{"/health", "/cache"} {
		req := httptest.NewRequest(http.MethodGet, path, nil)
		w := httptest.NewRecorder()
		srv.router.ServeHTTP(w, req)
		require.Equal(t, http.StatusNotFound, w.Code, "expected 404 at %s with custom base URL", path)
	}
}
