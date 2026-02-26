package helpers

import (
	"os"
	"path/filepath"
	"testing"
)

// resetGlobals clears the package-level alias state between tests.
func resetGlobals() {
	activeAliasIndex = nil
	activeAdapter = ""
}

// writeTempConfig writes JSON content to a temporary file and returns its path.
func writeTempConfig(t *testing.T, content string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "endpoint_aliases.json")
	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("failed to write temp config: %v", err)
	}
	return path
}

// sampleConfig is a minimal but representative alias config used across tests.
const sampleConfig = `{
  "adapters": {
    "test-adapter": {
      "endpoints": {
        "price": {
          "aliases": ["crypto", "forex"],
          "params": {
            "base": {
              "aliases": ["from", "coin"],
              "required": true
            },
            "quote": {
              "aliases": ["to", "market"],
              "required": true
            },
            "amount": {
              "aliases": ["qty"],
              "required": false
            }
          }
        },
        "stock": {
          "aliases": ["iex"],
          "params": {
            "ticker": {
              "aliases": ["symbol"],
              "required": true
            }
          }
        },
        "volume": {
          "params": null
        }
      }
    },
    "other-adapter": {
      "endpoints": {
        "balance": {
          "params": {
            "address": {
              "required": true
            }
          }
        }
      }
    }
  }
}`

// ---------------------------------------------------------------------------
// InitAliasIndex tests
// ---------------------------------------------------------------------------

func TestInitAliasIndex_EmptyAdapterName(t *testing.T) {
	resetGlobals()
	err := InitAliasIndex("", "/any/path")
	if err == nil {
		t.Fatal("expected error for empty adapter name, got nil")
	}
	if got := err.Error(); got != "ADAPTER_NAME must be set to enable alias mapping" {
		t.Fatalf("unexpected error message: %s", got)
	}
}

func TestInitAliasIndex_FileNotFound(t *testing.T) {
	resetGlobals()
	err := InitAliasIndex("test-adapter", "/nonexistent/path/endpoint_aliases.json")
	if err == nil {
		t.Fatal("expected error for missing file, got nil")
	}
}

func TestInitAliasIndex_InvalidJSON(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, `{invalid json`)
	err := InitAliasIndex("test-adapter", path)
	if err == nil {
		t.Fatal("expected error for invalid JSON, got nil")
	}
}

func TestInitAliasIndex_AdapterNotFound(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)
	err := InitAliasIndex("nonexistent-adapter", path)
	if err == nil {
		t.Fatal("expected error for unknown adapter, got nil")
	}
}

func TestInitAliasIndex_Success(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)

	if err := InitAliasIndex("test-adapter", path); err != nil {
		t.Fatalf("InitAliasIndex returned unexpected error: %v", err)
	}

	if activeAdapter != "test-adapter" {
		t.Errorf("activeAdapter = %q, want %q", activeAdapter, "test-adapter")
	}
	if activeAliasIndex == nil {
		t.Fatal("activeAliasIndex is nil after successful init")
	}

	// Verify endpoint aliases.
	endpointTests := []struct {
		alias  string
		wantEp string
		wantOK bool
	}{
		{"price", "price", true},
		{"crypto", "price", true},
		{"forex", "price", true},
		{"stock", "stock", true},
		{"iex", "stock", true},
		{"volume", "volume", true},
		{"unknown", "", false},
	}
	for _, tt := range endpointTests {
		got, ok := activeAliasIndex.endpointAlias[tt.alias]
		if ok != tt.wantOK {
			t.Errorf("endpointAlias[%q] exists=%v, want %v", tt.alias, ok, tt.wantOK)
		}
		if got != tt.wantEp {
			t.Errorf("endpointAlias[%q] = %q, want %q", tt.alias, got, tt.wantEp)
		}
	}

	// Verify param aliases for "price" endpoint.
	priceParams := activeAliasIndex.paramAlias["price"]
	if priceParams == nil {
		t.Fatal("paramAlias[\"price\"] is nil")
	}
	paramTests := []struct {
		alias     string
		wantCanon string
	}{
		{"base", "base"},
		{"from", "base"},
		{"coin", "base"},
		{"quote", "quote"},
		{"to", "quote"},
		{"market", "quote"},
		{"amount", "amount"},
		{"qty", "amount"},
	}
	for _, tt := range paramTests {
		pIdx, ok := priceParams[tt.alias]
		if !ok {
			t.Errorf("paramAlias[\"price\"][%q] not found", tt.alias)
			continue
		}
		if pIdx.CanonicalName != tt.wantCanon {
			t.Errorf("paramAlias[\"price\"][%q].CanonicalName = %q, want %q", tt.alias, pIdx.CanonicalName, tt.wantCanon)
		}
	}

	// Verify required params for "price" endpoint.
	requiredPrice := activeAliasIndex.requiredParams["price"]
	if requiredPrice == nil {
		t.Fatal("requiredParams[\"price\"] is nil")
	}
	if !requiredPrice["base"] {
		t.Error("base should be required for price endpoint")
	}
	if !requiredPrice["quote"] {
		t.Error("quote should be required for price endpoint")
	}
	if requiredPrice["amount"] {
		t.Error("amount should NOT be required for price endpoint")
	}

	// Verify orderedEndpointAliases is populated and sorted by descending length.
	aliases := activeAliasIndex.orderedEndpointAliases
	if len(aliases) == 0 {
		t.Fatal("orderedEndpointAliases is empty")
	}
	for i := 1; i < len(aliases); i++ {
		if len(aliases[i]) > len(aliases[i-1]) {
			t.Errorf("orderedEndpointAliases not sorted by length desc: %q (len %d) after %q (len %d)",
				aliases[i], len(aliases[i]), aliases[i-1], len(aliases[i-1]))
		}
	}
}

func TestInitAliasIndex_Idempotent(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)

	if err := InitAliasIndex("test-adapter", path); err != nil {
		t.Fatalf("first init failed: %v", err)
	}

	firstIdx := activeAliasIndex

	// Second call with the same adapter should be a no-op (cached).
	if err := InitAliasIndex("test-adapter", path); err != nil {
		t.Fatalf("second init failed: %v", err)
	}

	if activeAliasIndex != firstIdx {
		t.Error("expected second InitAliasIndex to reuse the same index (idempotent)")
	}
}

func TestInitAliasIndex_NilParams(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)

	if err := InitAliasIndex("test-adapter", path); err != nil {
		t.Fatalf("init failed: %v", err)
	}

	// "volume" endpoint has null params — should have no param aliases.
	if pm, ok := activeAliasIndex.paramAlias["volume"]; ok && len(pm) > 0 {
		t.Errorf("expected no paramAlias entries for 'volume', got %d", len(pm))
	}
}

// ---------------------------------------------------------------------------
// BuildCacheKeyParams tests
// ---------------------------------------------------------------------------

// initTestAdapter is a helper that resets globals and inits the test-adapter.
func initTestAdapter(t *testing.T) {
	t.Helper()
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)
	if err := InitAliasIndex("test-adapter", path); err != nil {
		t.Fatalf("failed to init alias index: %v", err)
	}
}

func TestBuildCacheKeyParams_AliasIndexNotInitialized(t *testing.T) {
	resetGlobals()
	_, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "ETH",
	})
	if err == nil {
		t.Fatal("expected error when alias index not initialized")
	}
}

func TestBuildCacheKeyParams_UnknownEndpoint(t *testing.T) {
	initTestAdapter(t)
	_, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "nonexistent",
		"base":     "ETH",
	})
	if err == nil {
		t.Fatal("expected error for unknown endpoint")
	}
}

func TestBuildCacheKeyParams_MissingEndpoint(t *testing.T) {
	initTestAdapter(t)
	_, err := BuildCacheKeyParams(map[string]interface{}{
		"base":  "ETH",
		"quote": "USD",
	})
	if err == nil {
		t.Fatal("expected error when endpoint is missing")
	}
}

func TestBuildCacheKeyParams_BasicCanonical(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "eth",
		"quote":    "usd",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertParam(t, result, "endpoint", "price")
	assertParam(t, result, "base", "ETH")
	assertParam(t, result, "quote", "USD")

	// "amount" is not required, should be absent even if passed.
	if _, ok := result["amount"]; ok {
		t.Error("non-required param 'amount' should not be in output")
	}
}

func TestBuildCacheKeyParams_EndpointAlias(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "crypto",
		"base":     "BTC",
		"quote":    "USD",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertParam(t, result, "endpoint", "price")
}

func TestBuildCacheKeyParams_ParamAliases(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"from":     "eth",
		"to":       "usd",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// "from" should map to canonical "base", "to" to "quote".
	assertParam(t, result, "base", "ETH")
	assertParam(t, result, "quote", "USD")

	if _, ok := result["from"]; ok {
		t.Error("alias 'from' should not appear as key in output")
	}
	if _, ok := result["to"]; ok {
		t.Error("alias 'to' should not appear as key in output")
	}
}

func TestBuildCacheKeyParams_NonRequiredParamOmitted(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "ETH",
		"quote":    "USD",
		"amount":   "100",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := result["amount"]; ok {
		t.Error("non-required param 'amount' should be filtered out")
	}
	assertParam(t, result, "base", "ETH")
	assertParam(t, result, "quote", "USD")
}

func TestBuildCacheKeyParams_ValuesUppercased(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "eth",
		"quote":    "usd",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertParam(t, result, "base", "ETH")
	assertParam(t, result, "quote", "USD")
}

func TestBuildCacheKeyParams_NilValueSkipped(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "ETH",
		"quote":    nil,
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := result["quote"]; ok {
		t.Error("nil value should be skipped")
	}
}

func TestBuildCacheKeyParams_EmptyStringValueSkipped(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "ETH",
		"quote":    "",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := result["quote"]; ok {
		t.Error("empty string value should be skipped")
	}
}

func TestBuildCacheKeyParams_OverridesApplied(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "WBTC",
		"quote":    "USD",
		"overrides": map[string]interface{}{
			"test-adapter": map[string]interface{}{
				"WBTC": "BTC",
			},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertParam(t, result, "base", "BTC")
	assertParam(t, result, "quote", "USD")
}

func TestBuildCacheKeyParams_OverridesNotInOutput(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "ETH",
		"quote":    "USD",
		"overrides": map[string]interface{}{
			"test-adapter": map[string]interface{}{},
		},
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := result["overrides"]; ok {
		t.Error("'overrides' key should not appear in output params")
	}
}

func TestBuildCacheKeyParams_EndpointWithNoRequiredMetadata(t *testing.T) {
	initTestAdapter(t)

	// "volume" endpoint has null params — no required metadata, all params kept.
	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "volume",
		"foo":      "bar",
		"baz":      "qux",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertParam(t, result, "endpoint", "volume")
	assertParam(t, result, "foo", "BAR")
	assertParam(t, result, "baz", "QUX")
}

// assertParam checks that result[key] equals want.
func assertParam(t *testing.T, result map[string]string, key, want string) {
	t.Helper()
	got, ok := result[key]
	if !ok {
		t.Errorf("expected key %q in result, but not found. Result: %v", key, result)
		return
	}
	if got != want {
		t.Errorf("result[%q] = %q, want %q", key, got, want)
	}
}
