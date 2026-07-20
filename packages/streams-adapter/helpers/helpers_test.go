package helpers

import (
	"crypto/sha256"
	"testing"

	"github.com/stretchr/testify/require"

	types "streams-adapter/common"
)

func TestObservationPayloadHash(t *testing.T) {
	dataA := map[string]interface{}{"quote": "USD", "base": "ETH", "nested": map[string]interface{}{"enabled": true}}
	dataB := map[string]interface{}{"nested": map[string]interface{}{"enabled": true}, "base": "ETH", "quote": "USD"}

	hashA, err := ObservationPayloadHash("test", dataA)
	require.NoError(t, err)
	hashB, err := ObservationPayloadHash("test", dataB)
	require.NoError(t, err)
	require.Equal(t, hashA, hashB)
	require.Equal(t, sha256.Sum256([]byte(`test{"base":"ETH","nested":{"enabled":true},"quote":"USD"}`)), hashA)

	otherAdapterHash, err := ObservationPayloadHash("other", dataA)
	require.NoError(t, err)
	require.NotEqual(t, hashA, otherAdapterHash)
}

// ---------------------------------------------------------------------------
// RequestParamsFromKey tests
// ---------------------------------------------------------------------------

func TestRequestParamsFromKey_MalformedJSON(t *testing.T) {
	initTestAdapter(t)

	_, err := RequestParamsFromKey(`adapter-price-{invalid json}`)
	require.Error(t, err)
}

func TestRequestParamsFromKey_WithExplicitEndpoint(t *testing.T) {
	initTestAdapter(t)

	result, err := RequestParamsFromKey(`adapter-price-{"endpoint":"price","base":"eth","quote":"usd"}`)
	require.NoError(t, err)

	assertParam(t, result, "endpoint", "price")
	assertParam(t, result, "base", "ETH")
	assertParam(t, result, "quote", "USD")
}

func TestRequestParamsFromKey_EndpointDerivedFromKey(t *testing.T) {
	initTestAdapter(t)

	// No "endpoint" in JSON — should derive from the key prefix.
	result, err := RequestParamsFromKey(`adapter-price-{"base":"btc","quote":"usd"}`)
	require.NoError(t, err)

	assertParam(t, result, "endpoint", "price")
	assertParam(t, result, "base", "BTC")
	assertParam(t, result, "quote", "USD")
}

func TestRequestParamsFromKey_EndpointAliasDerivedFromKey(t *testing.T) {
	initTestAdapter(t)

	// "crypto" is an alias for "price" — findEndpointInKey should resolve it.
	result, err := RequestParamsFromKey(`adapter-crypto-{"base":"eth","quote":"usd"}`)
	require.NoError(t, err)

	assertParam(t, result, "endpoint", "price")
}

func TestRequestParamsFromKey_CannotDeriveEndpoint(t *testing.T) {
	initTestAdapter(t)

	_, err := RequestParamsFromKey(`adapter-unknown-{"base":"eth"}`)
	require.Error(t, err)
}

func TestRequestParamsFromKey_AliasIndexNotInitialized(t *testing.T) {
	resetGlobals()

	require.Panics(t, func() {
		RequestParamsFromKey(`adapter-price-{"base":"eth"}`)
	})
}

// ---------------------------------------------------------------------------
// CalculateCacheKey test
// ---------------------------------------------------------------------------

func TestCalculateCacheKey(t *testing.T) {
	key, err := CalculateCacheKey(types.RequestParams{
		"endpoint": "crypto-LWBA",
		"base":     "ETH",
	})
	require.NoError(t, err)
	require.Equal(t, "base=eth:endpoint=cryptolwba", key)
}
