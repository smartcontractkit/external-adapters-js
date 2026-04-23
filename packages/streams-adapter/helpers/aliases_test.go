package helpers

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/require"
)

// resetGlobals clears the package-level alias state between tests.
func resetGlobals() {
	activeIndex = nil
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

// sampleConfig is a minimal but representative alias config.
const sampleConfig = `{
  "adapters": {
    "test-adapter": {
      "endpoints": {
        "price": {
          "aliases": ["crypto", "forex"]
        },
        "stock": {
          "aliases": ["iex"]
        },
        "volume": {}
      }
    },
    "other-adapter": {
      "endpoints": {
        "balance": {}
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
	require.NotNil(t, activeIndex)

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
		got, ok := activeIndex.alias[tt.alias]
		require.Equal(t, tt.wantOK, ok)
		require.Equal(t, tt.wantEp, got)
	}

	// Verify ordered aliases are populated and sorted by descending length.
	aliases := activeIndex.ordered
	if len(aliases) == 0 {
		t.Fatal("ordered aliases is empty")
	}
	for i := 1; i < len(aliases); i++ {
		if len(aliases[i]) > len(aliases[i-1]) {
			t.Errorf("ordered aliases not sorted by length desc: %q (len %d) after %q (len %d)",
				aliases[i], len(aliases[i]), aliases[i-1], len(aliases[i-1]))
		}
	}
}

func TestInitAliasIndex_Idempotent(t *testing.T) {
	resetGlobals()
	path := writeTempConfig(t, sampleConfig)

	require.NoError(t, InitAliasIndex("test-adapter", path))

	firstIdx := activeIndex

	// Second call with the same adapter should be a no-op (cached).
	require.NoError(t, InitAliasIndex("test-adapter", path))

	require.Equal(t, firstIdx, activeIndex)
}

// ---------------------------------------------------------------------------
// findEndpointInKey tests
// ---------------------------------------------------------------------------

func TestFindEndpointInKey_IndexNotInitialized(t *testing.T) {
	resetGlobals()
	require.Panics(t, func() {
		findEndpointInKey("TEST-ADAPTER-price-ws-subscriptionSet")
	})
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
	require.Panics(t, func() {
		BuildCacheKeyParams(map[string]interface{}{
			"endpoint": "price",
			"base":     "ETH",
		})
	})
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

func TestBuildCacheKeyParams_OverridesStripped(t *testing.T) {
	initTestAdapter(t)

	// Overrides are no longer processed, just stripped from output.
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
	require.NoError(t, err)

	// No override applied — value stays as WBTC
	assertParam(t, result, "base", "WBTC")
	assertParam(t, result, "quote", "USD")
	if _, ok := result["overrides"]; ok {
		t.Error("'overrides' key should not appear in output params")
	}
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
