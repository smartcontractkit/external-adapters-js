package helpers

import (
	"errors"
	"fmt"
	"maps"
	"slices"
	"strings"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

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

// TransformedKeyFromAdapterKey derives the internal transformed cache key from
// the Redis adapter key used by the JS adapter when publishing observations.
//
// The v3 framework cache key is structured as
// `${prefix}-${adapterName}-${endpointName}-${transportName}-${paramsKey}`
// where `paramsKey` is either a JSON params blob (small payloads) or a bare
// base64 sha1 hash (when the serialized params exceed MAX_COMMON_KEY_SIZE).
// See ea-framework-js src/cache/index.ts: calculateParamsKey.
func TransformedKeyFromAdapterKey(key string) (string, error) {
	if !strings.Contains(key, "{") {
		// Hashed-params form: take the bare base64 segment after the last dash.
		lastDash := strings.LastIndex(key, "-")
		if lastDash == -1 || lastDash == len(key)-1 {
			return "", errors.New("invalid key format: missing params segment")
		}
		return key[lastDash+1:], nil
	}

	params, err := RequestParamsFromKey(key)
	if err != nil {
		return "", err
	}
	return CalculateCacheKey(params)
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
func TransformedKeyFromFeedID(feedID, endpoint string) (string, error) {
	if !strings.HasPrefix(feedID, "{") {
		return feedID, nil
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
	return CalculateCacheKey(params)
}
