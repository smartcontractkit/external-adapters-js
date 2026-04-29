package helpers

import (
	"errors"
	"fmt"
	"sort"
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

// CalculateCacheKey generates a deterministic cache key from request parameters.
func CalculateCacheKey(params types.RequestParams) (string, error) {
	if len(params) == 0 {
		return "", errors.New("cannot calculate cache key: empty request params")
	}

	// Extract and sort keys for deterministic ordering
	keys := make([]string, 0, len(params))
	for key := range params {
		keys = append(keys, key)
	}
	sort.Strings(keys)

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
// The endpoint parameter is the canonical endpoint name (e.g. "cryptolwba") and
// is injected into the params when the feedId JSON does not already contain it.
func TransformedKeyFromFeedID(feedID, endpoint string) (string, error) {
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
