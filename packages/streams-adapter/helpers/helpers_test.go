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

func TestTransformedKeyFromFeedID_JSONParams(t *testing.T) {
	initTestAdapter(t)

	key, err := TransformedKeyFromFeedID(`{"base":"ETH","quote":"USD"}`, "price", "")
	require.NoError(t, err)
	require.Equal(t, "base=eth:endpoint=price:quote=usd", key)
}

func TestTransformedKeyFromFeedID_OpaqueHash(t *testing.T) {
	key, err := TransformedKeyFromFeedID("Ff25JqfZC9B/NRMI2Kyn9x1gcH0=", "calculated-multi-function", "")
	require.NoError(t, err)
	require.Equal(t, "Ff25JqfZC9B/NRMI2Kyn9x1gcH0=", key)
}

func TestTransformedKeyFromAdapterKey_JSONParams(t *testing.T) {
	initTestAdapter(t)

	key, err := TransformedKeyFromAdapterKey(`adapter-price-{"base":"eth","quote":"usd"}`, "")
	require.NoError(t, err)
	require.Equal(t, "base=eth:endpoint=price:quote=usd", key)
}

func TestTransformedKeyFromAdapterKey_OpaqueHash(t *testing.T) {
	key, err := TransformedKeyFromAdapterKey("view-function-multi-chain-data-streams-VIEW_FUNCTION_MULTI_CHAIN-calculated-multi-function-default_single_transport-Ff25JqfZC9B/NRMI2Kyn9x1gcH0=", "")
	require.NoError(t, err)
	require.Equal(t, "Ff25JqfZC9B/NRMI2Kyn9x1gcH0=", key)
}

// ---------------------------------------------------------------------------
// Transport-qualified transformed keys
// ---------------------------------------------------------------------------

// The keys below are the production shape for BIL/USD, whose two live streams
// target the same dxFeed symbol and differ only by transport: one omits
// `transport` and falls through to the price endpoint's defaultTransport
// (`rest`), the other asks for `ws`. Before transport qualification both derived
// `base=bil:uslf24:endpoint=price` and shared one cache slot, so whichever route
// wrote last overwrote the other's observation.
const (
	dxfeedRestAdapterKey = `dxfeed-data-streams-DXFEED-price-rest-{"base":"bil:uslf24"}`
	dxfeedWsAdapterKey   = `dxfeed-data-streams-DXFEED-price-ws-{"base":"bil:uslf24"}`
	dxfeedFeedID         = `{"base":"bil:uslf24"}`
)

func TestTransformedKeyFromAdapterKey_SeparatesTransports(t *testing.T) {
	initTestAdapter(t)

	rest, err := TransformedKeyFromAdapterKey(dxfeedRestAdapterKey, "rest")
	require.NoError(t, err)
	ws, err := TransformedKeyFromAdapterKey(dxfeedWsAdapterKey, "ws")
	require.NoError(t, err)

	require.Equal(t, "base=bil:uslf24:endpoint=price:transport=rest", rest)
	require.Equal(t, "base=bil:uslf24:endpoint=price:transport=ws", ws)
	require.NotEqual(t, rest, ws)
}

func TestTransformedKeyFromFeedID_SeparatesTransports(t *testing.T) {
	initTestAdapter(t)

	rest, err := TransformedKeyFromFeedID(dxfeedFeedID, "price", "rest")
	require.NoError(t, err)
	ws, err := TransformedKeyFromFeedID(dxfeedFeedID, "price", "ws")
	require.NoError(t, err)

	require.Equal(t, "base=bil:uslf24:endpoint=price:transport=rest", rest)
	require.NotEqual(t, rest, ws)
}

// The Redcon write path and the feedId learn path derive the transformed key
// from different inputs, and an observation only reaches a subscriber when the
// two agree. That equality is the invariant transport qualification must not
// break — including when the transport is unknown and both have to fall back to
// the unqualified key.
func TestTransformedKey_WriteAndLearnPathsAgree(t *testing.T) {
	initTestAdapter(t)

	for _, transport := range []string{"rest", "ws", "default_single_transport", ""} {
		t.Run("transport="+transport, func(t *testing.T) {
			fromWrite, err := TransformedKeyFromAdapterKey(dxfeedRestAdapterKey, transport)
			require.NoError(t, err)
			fromLearn, err := TransformedKeyFromFeedID(dxfeedFeedID, "price", transport)
			require.NoError(t, err)
			require.Equal(t, fromWrite, fromLearn)
		})
	}
}

// The transport comes from meta.transportName, never from parsing the adapter
// key: neither ${prefix} nor ${endpointName} can be split off by counting
// dashes, since both routinely contain them.
func TestTransformedKeyFromAdapterKey_IgnoresTransportSegmentInKey(t *testing.T) {
	initTestAdapter(t)

	key, err := TransformedKeyFromAdapterKey(dxfeedRestAdapterKey, "ws")
	require.NoError(t, err)
	require.Equal(t, "base=bil:uslf24:endpoint=price:transport=ws", key)
}

// An empty transport must reproduce the pre-qualification key byte for byte, so
// a framework that does not report meta.transportName degrades both paths
// together instead of splitting them apart.
func TestTransformedKey_EmptyTransportIsUnqualified(t *testing.T) {
	initTestAdapter(t)

	key, err := TransformedKeyFromAdapterKey(dxfeedWsAdapterKey, "")
	require.NoError(t, err)
	require.Equal(t, "base=bil:uslf24:endpoint=price", key)
}

// Opaque (hashed-params) keys have no parameter structure to merge into, so the
// transport is appended as a trailing segment — normalized identically on both
// paths.
func TestTransformedKey_OpaqueHashQualifiedByTransport(t *testing.T) {
	const opaqueAdapterKey = "view-function-multi-chain-data-streams-VIEW_FUNCTION_MULTI_CHAIN-calculated-multi-function-default_single_transport-Ff25JqfZC9B/NRMI2Kyn9x1gcH0="

	fromWrite, err := TransformedKeyFromAdapterKey(opaqueAdapterKey, "default_single_transport")
	require.NoError(t, err)
	fromLearn, err := TransformedKeyFromFeedID("Ff25JqfZC9B/NRMI2Kyn9x1gcH0=", "calculated-multi-function", "default_single_transport")
	require.NoError(t, err)

	require.Equal(t, "Ff25JqfZC9B/NRMI2Kyn9x1gcH0=:transport=defaultsingletransport", fromWrite)
	require.Equal(t, fromWrite, fromLearn)
}

// A params blob carrying its own `transport` is overwritten by the transport
// that actually served the response, so the write and learn paths cannot
// disagree about which of the two to key on.
func TestTransformedKey_ServingTransportOverridesParam(t *testing.T) {
	initTestAdapter(t)

	key, err := TransformedKeyFromAdapterKey(`adapter-price-{"base":"eth","transport":"rest"}`, "ws")
	require.NoError(t, err)
	require.Equal(t, "base=eth:endpoint=price:transport=ws", key)
}
