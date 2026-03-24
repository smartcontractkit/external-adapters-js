package helpers

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
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
	require.Error(t, err)
	require.Equal(t, "ADAPTER_NAME must be set to enable alias mapping", err.Error())
}

func TestInitAliasIndex_FileNotFound(t *testing.T) {
	resetGlobals()
	err := InitAliasIndex("test-adapter", "/nonexistent/path/endpoint_aliases.json")
	require.Error(t, err)
}

func TestInitAliasIndex_InvalidJSON(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, `{invalid json`)
	err := InitAliasIndex("test-adapter", path)
	require.Error(t, err)
}

func TestInitAliasIndex_AdapterNotFound(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)
	err := InitAliasIndex("nonexistent-adapter", path)
	require.Error(t, err)
}

func TestInitAliasIndex_Success(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)

	require.NoError(t, InitAliasIndex("test-adapter", path))

	require.Equal(t, "test-adapter", activeAdapter)
	require.NotNil(t, activeAliasIndex)

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
		require.Equal(t, tt.wantOK, ok)
		require.Equal(t, tt.wantEp, got)
	}

	// Verify param aliases for "price" endpoint.
	priceParams := activeAliasIndex.paramAlias["price"]
	require.NotNil(t, priceParams)
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
		require.Equal(t, tt.wantCanon, pIdx.CanonicalName)
	}

	// Verify required params for "price" endpoint.
	requiredPrice := activeAliasIndex.requiredParams["price"]
	require.NotNil(t, requiredPrice)
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

	require.NoError(t, InitAliasIndex("test-adapter", path))

	firstIdx := activeAliasIndex

	// Second call with the same adapter should be a no-op (cached).
	require.NoError(t, InitAliasIndex("test-adapter", path))

	require.Equal(t, firstIdx, activeAliasIndex)
}

func TestInitAliasIndex_NilParams(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)

	require.NoError(t, InitAliasIndex("test-adapter", path))

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
	require.NoError(t, InitAliasIndex("test-adapter", path))
}

func TestBuildCacheKeyParams_AliasIndexNotInitialized(t *testing.T) {
	resetGlobals()
	_, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "ETH",
	})
	require.Error(t, err)
}

func TestBuildCacheKeyParams_UnknownEndpoint(t *testing.T) {
	initTestAdapter(t)
	_, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "nonexistent",
		"base":     "ETH",
	})
	require.Error(t, err)
}

func TestBuildCacheKeyParams_MissingEndpoint(t *testing.T) {
	initTestAdapter(t)
	_, err := BuildCacheKeyParams(map[string]interface{}{
		"base":  "ETH",
		"quote": "USD",
	})
	require.Error(t, err)
}

func TestBuildCacheKeyParams_BasicCanonical(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "eth",
		"quote":    "usd",
	})
	require.NoError(t, err)

	assertParam(t, result, "endpoint", "price")
	assertParam(t, result, "base", "ETH")
	assertParam(t, result, "quote", "USD")
}

func TestBuildCacheKeyParams_EndpointAlias(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "crypto",
		"base":     "BTC",
		"quote":    "USD",
	})
	require.NoError(t, err)

	assertParam(t, result, "endpoint", "price")
}

func TestBuildCacheKeyParams_ParamAliases(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"from":     "eth",
		"to":       "usd",
	})
	require.NoError(t, err)

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

func TestBuildCacheKeyParams_ValuesUppercased(t *testing.T) {
	initTestAdapter(t)

	result, err := BuildCacheKeyParams(map[string]interface{}{
		"endpoint": "price",
		"base":     "eth",
		"quote":    "usd",
	})
	require.NoError(t, err)

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
	require.NoError(t, err)

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
	require.NoError(t, err)

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
			"other-adapter": map[string]interface{}{
				"WBTC": "ETH",
			},
		},
	})
	require.NoError(t, err)

	assertParam(t, result, "base", "BTC")
	require.NotEqual(t, "WBTC", result["base"])
	assertParam(t, result, "quote", "USD")
	if _, ok := result["overrides"]; ok {
		t.Error("'overrides' key should not appear in output params")
	}
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
	require.NoError(t, err)

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
	require.NoError(t, err)

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
	require.Equal(t, want, got)
}
