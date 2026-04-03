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

	keyMapper := helpers.NewKeyMapper(slog.Default())
	testSrv = New(cfg, testCache, slog.Default(), keyMapper)

	os.Exit(m.Run())
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
	testCache.Set(params, obs, time.Now(), "test-key")

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
