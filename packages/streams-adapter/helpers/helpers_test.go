package helpers

import (
	"testing"

	types "streams-adapter/common"
)

// ---------------------------------------------------------------------------
// RequestParamsFromKey tests
// ---------------------------------------------------------------------------

func TestRequestParamsFromKey_MalformedJSON(t *testing.T) {
	initTestAdapter(t)

	_, err := RequestParamsFromKey(`adapter-price-{invalid json}`)
	if err == nil {
		t.Fatal("expected error for malformed JSON")
	}
}

func TestRequestParamsFromKey_WithExplicitEndpoint(t *testing.T) {
	initTestAdapter(t)

	result, err := RequestParamsFromKey(`adapter-price-{"endpoint":"price","base":"eth","quote":"usd"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertParam(t, result, "endpoint", "price")
	assertParam(t, result, "base", "ETH")
	assertParam(t, result, "quote", "USD")
}

func TestRequestParamsFromKey_EndpointDerivedFromKey(t *testing.T) {
	initTestAdapter(t)

	// No "endpoint" in JSON — should derive from the key prefix.
	result, err := RequestParamsFromKey(`adapter-price-{"base":"btc","quote":"usd"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertParam(t, result, "endpoint", "price")
	assertParam(t, result, "base", "BTC")
	assertParam(t, result, "quote", "USD")
}

func TestRequestParamsFromKey_EndpointAliasDerivedFromKey(t *testing.T) {
	initTestAdapter(t)

	// "crypto" is an alias for "price" — findEndpointInKey should resolve it.
	result, err := RequestParamsFromKey(`adapter-crypto-{"base":"eth","quote":"usd"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	assertParam(t, result, "endpoint", "price")
}

func TestRequestParamsFromKey_CannotDeriveEndpoint(t *testing.T) {
	initTestAdapter(t)

	_, err := RequestParamsFromKey(`adapter-unknown-{"base":"eth"}`)
	if err == nil {
		t.Fatal("expected error when endpoint cannot be derived")
	}
}

func TestRequestParamsFromKey_ParamAliasesResolved(t *testing.T) {
	initTestAdapter(t)

	result, err := RequestParamsFromKey(`adapter-price-{"endpoint":"price","from":"eth","to":"usd"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// "from" -> "base", "to" -> "quote"
	assertParam(t, result, "base", "ETH")
	assertParam(t, result, "quote", "USD")
}

func TestRequestParamsFromKey_NonRequiredParamsOmitted(t *testing.T) {
	initTestAdapter(t)

	result, err := RequestParamsFromKey(`adapter-price-{"endpoint":"price","base":"eth","quote":"usd","amount":"100"}`)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if _, ok := result["amount"]; ok {
		t.Error("non-required param 'amount' should be filtered out")
	}
}

func TestRequestParamsFromKey_AliasIndexNotInitialized(t *testing.T) {
	resetGlobals()

	_, err := RequestParamsFromKey(`adapter-price-{"base":"eth"}`)
	if err == nil {
		t.Fatal("expected error when alias index is not initialized")
	}
}

// ---------------------------------------------------------------------------
// CalculateCacheKey tests
// ---------------------------------------------------------------------------

func TestCalculateCacheKey_EmptyParams(t *testing.T) {
	_, err := CalculateCacheKey(types.RequestParams{})
	if err == nil {
		t.Fatal("expected error for empty params")
	}
}

func TestCalculateCacheKey_SingleParam(t *testing.T) {
	key, err := CalculateCacheKey(types.RequestParams{
		"endpoint": "price",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	want := "endpoint=price"
	if key != want {
		t.Errorf("key = %q, want %q", key, want)
	}
}

func TestCalculateCacheKey_NormalizesValues(t *testing.T) {
	key, err := CalculateCacheKey(types.RequestParams{
		"endpoint": "crypto-LWBA",
		"base":     "ETH",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// NormalizeString strips dashes/underscores and lowercases.
	want := "base=eth:endpoint=cryptolwba"
	if key != want {
		t.Errorf("key = %q, want %q", key, want)
	}
}

func TestCalculateCacheKey_SkipsEmptyValues(t *testing.T) {
	key, err := CalculateCacheKey(types.RequestParams{
		"endpoint": "price",
		"base":     "ETH",
		"quote":    "",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// "quote" has empty value and should be omitted.
	want := "base=eth:endpoint=price"
	if key != want {
		t.Errorf("key = %q, want %q", key, want)
	}
}

func TestCalculateCacheKey_UnderscoresAndDashesStripped(t *testing.T) {
	key, err := CalculateCacheKey(types.RequestParams{
		"endpoint":   "price",
		"some_param": "some-value",
	})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	// Both key and value are normalized: dashes/underscores removed, lowercased.
	want := "endpoint=price:someparam=somevalue"
	if key != want {
		t.Errorf("key = %q, want %q", key, want)
	}
}
