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
		CacheMaxSize:         100,
		CacheTTLMinutes:      5,
		CacheCleanupInterval: 60,
		LogLevel:             "info",
		AdapterName:          "test",
	}

	testCache = cache.New(cache.Config{
		MaxSize:         100,
		TTL:             5 * time.Minute,
		CleanupInterval: 10 * time.Minute,
	})

	testSrv = New(cfg, testCache, slog.Default())

	os.Exit(m.Run())
}

func TestHealthHandler(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/health", nil)
	w := httptest.NewRecorder()
	testSrv.router.ServeHTTP(w, req)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}

	var body map[string]interface{}
	if err := json.Unmarshal(w.Body.Bytes(), &body); err != nil {
		t.Fatalf("failed to parse response body: %v", err)
	}
	if body["status"] != "healthy" {
		t.Errorf("expected status=healthy, got %v", body["status"])
	}
}

func TestAdapterHandler_BadRequest(t *testing.T) {

	req := httptest.NewRequest(http.MethodPost, "/", strings.NewReader(`{"invalid"}`))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	testSrv.router.ServeHTTP(w, req)

	if w.Code != http.StatusBadRequest {
		t.Fatalf("expected status 400, got %d", w.Code)
	}
}

func TestAdapterHandler_CacheHit(t *testing.T) {
	// Pre-populate cache with known params
	params := types.RequestParams{"endpoint": "crypto", "base": "eth", "quote": "usd"}
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

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d; body: %s", w.Code, w.Body.String())
	}

	var resp types.Observation
	if err := json.Unmarshal(w.Body.Bytes(), &resp); err != nil {
		t.Fatalf("failed to parse response: %v", err)
	}
	if !resp.Success {
		t.Error("expected success=true in cached response")
	}
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
	if w.Code != http.StatusGatewayTimeout {
		t.Fatalf("expected status 504, got %d; body: %s", w.Code, w.Body.String())
	}

	var errResp ErrorResponseData
	if err := json.Unmarshal(w.Body.Bytes(), &errResp); err != nil {
		t.Fatalf("failed to parse error response: %v", err)
	}
	if errResp.Error.Name != "AdapterError" {
		t.Errorf("expected error name AdapterError, got %s", errResp.Error.Name)
	}
}
