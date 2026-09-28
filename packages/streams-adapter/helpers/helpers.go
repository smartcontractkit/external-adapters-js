package helpers

import (
	"crypto/sha256"
	stdjson "encoding/json"
	"errors"
	"fmt"
	"maps"
	"slices"
	"strings"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

// ObservationPayloadHash identifies a request payload within an adapter.
func ObservationPayloadHash(adapterName string, requestData map[string]interface{}) ([32]byte, error) {
	lookupBytes, err := stdjson.Marshal(requestData)
	if err != nil {
		return [32]byte{}, fmt.Errorf("failed to marshal observation lookup payload: %w", err)
	}
	b := make([]byte, 0, len(adapterName)+len(lookupBytes))
	b = append(b, adapterName...)
	b = append(b, lookupBytes...)
	return sha256.Sum256(b), nil
}

// normalizeString removes dashes and underscores for flexible matching.
func normalizeString(s string) string {
	s = strings.ReplaceAll(s, "-", "")
	s = strings.ReplaceAll(s, "_", "")
	return strings.ToLower(s)
}

// RequestParamsFromKey extracts RequestParams from a Redis key (OriginalAdapterKey).
// Expected format (simplified): <prefix>-{...endpoint info...}-<json_params>
// It parses the JSON params and uses the loaded alias index (if available)
// to normalize endpoint and parameter names to their canonical forms.
// Returns an error when the key is malformed, JSON cannot be parsed, or the
// endpoint cannot be derived.
func RequestParamsFromKey(key string) (types.RequestParams, error) {
	// Find the JSON portion of the key (starts with '{' and ends with '}')
	jsonStart := strings.Index(key, "{")
	jsonEnd := strings.LastIndex(key, "}")

	if jsonStart == -1 || jsonEnd == -1 || jsonEnd <= jsonStart {
		return nil, errors.New("invalid key format: missing or malformed JSON portion")
	}

	jsonStr := key[jsonStart : jsonEnd+1]

	// Parse the JSON to extract all parameters
	var paramsMap map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &paramsMap); err != nil {
		return nil, err
	}

	// Ensure we have an endpoint hint: prefer explicit param, otherwise try to
	// derive it from the key and inject it as the endpoint parameter.
	if _, ok := paramsMap["endpoint"]; !ok {
		epAlias, err := findEndpointInKey(key)
		if err != nil {
			return nil, err
		}
		paramsMap["endpoint"] = epAlias
	}

	canonical, err := BuildCacheKeyParams(paramsMap)
	if err != nil {
		return nil, err
	}
	return canonical, nil
}

// transportParam is the pseudo-parameter under which an adapter response's
// transport name is folded into a transformed cache key.
//
// The v3 framework treats `transport` as a routing directive rather than a
// request parameter: TransportRoutes consumes it to pick a route (falling back
// to the endpoint's defaultTransport when absent) and strips it before building
// the params blob. Two requests that differ only by transport therefore produce
// identical params, identical transformed keys, and share one cache slot — so
// whichever route writes last overwrites the other's observation. Folding the
// transport back into the key keeps them in separate slots.
//
// A params blob that already carries a genuine `transport` parameter is
// overwritten with the transport that actually served the response; the two
// describe the same thing, and taking the response's value keeps the write and
// learn paths in agreement.
const transportParam = "transport"

// TransformedKeyFromAdapterKey derives the internal transformed cache key from
// the Redis adapter key used by the JS adapter when publishing observations.
//
// The v3 framework cache key is structured as
// `${prefix}-${adapterName}-${endpointName}-${transportName}-${paramsKey}`
// where `paramsKey` is either a JSON params blob (small payloads) or a bare
// base64 sha1 hash (when the serialized params exceed MAX_COMMON_KEY_SIZE).
// See ea-framework-js src/cache/index.ts: calculateParamsKey.
//
// transport is the value of AdapterResponse.meta.transportName from the same
// response being cached, not a segment parsed out of key. The key cannot be
// split reliably — both `${prefix}` and `${endpointName}` routinely contain
// dashes (`dxfeed-data-streams`, `calculated-multi-function`), so the segment
// before `${paramsKey}` is only the transport when a transport segment is
// present at all. Reading meta.transportName instead gives this path and
// TransformedKeyFromFeedID the same source of truth, which is what keeps the
// keys they produce equal. An empty transport reproduces the previous,
// transport-blind key, so a framework that does not report the field degrades
// on both paths together rather than splitting them apart.
func TransformedKeyFromAdapterKey(key, transport string) (string, error) {
	if !strings.Contains(key, "{") {
		// Hashed-params form: take the bare base64 segment after the last dash.
		lastDash := strings.LastIndex(key, "-")
		if lastDash == -1 || lastDash == len(key)-1 {
			return "", errors.New("invalid key format: missing params segment")
		}
		return qualifyHashedKey(key[lastDash+1:], transport), nil
	}

	params, err := RequestParamsFromKey(key)
	if err != nil {
		return "", err
	}
	return CalculateCacheKey(withTransport(params, transport))
}

// withTransport folds transport into params under transportParam. An empty
// transport leaves params untouched so the resulting key is byte-identical to
// the one produced before transport qualification existed.
func withTransport(params types.RequestParams, transport string) types.RequestParams {
	if transport == "" {
		return params
	}
	params[transportParam] = transport
	return params
}

// qualifyHashedKey appends transport to an opaque (hashed-params) transformed
// key. The hash has no parameter structure to merge into, so the transport is
// appended as a trailing segment in the same `key=value` shape CalculateCacheKey
// emits, normalized the same way so both derivation paths agree.
func qualifyHashedKey(hashed, transport string) string {
	if transport == "" {
		return hashed
	}
	return hashed + ":" + transportParam + "=" + normalizeString(transport)
}

// CalculateCacheKey generates a deterministic cache key from request parameters.
func CalculateCacheKey(params types.RequestParams) (string, error) {
	if len(params) == 0 {
		return "", errors.New("cannot calculate cache key: empty request params")
	}

	// Extract and sort keys for deterministic ordering
	keys := slices.Sorted(maps.Keys(params))

	// Build the cache key
	var parts []string
	for _, key := range keys {
		value := params[key]
		if value != "" {
			// Normalize both key and value for case-insensitive matching
			normalizedKey := normalizeString(key)
			normalizedValue := normalizeString(value)
			parts = append(parts, normalizedKey+"="+normalizedValue)
		}
	}

	return strings.Join(parts, ":"), nil
}

// TransformedKeyFromFeedID derives the internal transformed cache key from the
// feedId string returned in the JS adapter's HTTP response under
// meta.metrics.feedId (e.g. `{"index":"u_aixbtusd_rti","adapterNameOverride":"cfbenchmarks2"}`).
//
// For large payloads the v3 framework returns a bare base64 sha1 hash instead
// of a JSON object, which is returned verbatim. The endpoint parameter is the
// canonical endpoint name (e.g. "cryptolwba") and is injected into the params
// when the feedId JSON does not already contain it.
//
// transport is AdapterResponse.meta.transportName from the response the feedId
// was read out of — the same field TransformedKeyFromAdapterKey folds in — and
// is what makes this path agree with the keys the JS adapter's cache writes
// produce. See transportParam.
func TransformedKeyFromFeedID(feedID, endpoint, transport string) (string, error) {
	if !strings.HasPrefix(feedID, "{") {
		return qualifyHashedKey(feedID, transport), nil
	}

	var feedParams map[string]interface{}
	if err := json.Unmarshal([]byte(feedID), &feedParams); err != nil {
		return "", fmt.Errorf("failed to parse feedId %q: %w", feedID, err)
	}
	if _, ok := feedParams["endpoint"]; !ok {
		feedParams["endpoint"] = endpoint
	}
	params, err := BuildCacheKeyParams(feedParams)
	if err != nil {
		return "", fmt.Errorf("failed to build cache key params from feedId: %w", err)
	}
	return CalculateCacheKey(withTransport(params, transport))
}
