package helpers

import (
	"sort"
	"strings"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

// NormalizeString removes dashes and underscores for flexible matching.
func NormalizeString(s string) string {
	s = strings.ReplaceAll(s, "-", "")
	s = strings.ReplaceAll(s, "_", "")
	return strings.ToLower(s)
}

// RequestParamsFromKey extracts RequestParams from a Redis key (OriginalAdapterKey).
// Expected format (simplified): <prefix>-{...endpoint info...}-<json_params>
// It parses the JSON params and uses the loaded alias index (if available)
// to normalize endpoint and parameter names to their canonical forms.
func RequestParamsFromKey(key string) (types.RequestParams, bool) {
	// Find the JSON portion of the key (starts with '{' and ends with '}')
	jsonStart := strings.Index(key, "{")
	jsonEnd := strings.LastIndex(key, "}")

	if jsonStart == -1 || jsonEnd == -1 || jsonEnd <= jsonStart {
		return nil, false
	}

	jsonStr := key[jsonStart : jsonEnd+1]

	// Parse the JSON to extract all parameters
	var paramsMap map[string]interface{}
	if err := json.Unmarshal([]byte(jsonStr), &paramsMap); err != nil {
		return nil, false
	}

	// Convert all values to strings
	rawParams := make(types.RequestParams)
	for k, v := range paramsMap {
		if strVal, ok := v.(string); ok {
			rawParams[k] = strVal
		}
	}

	// Ensure we have an endpoint hint: prefer explicit param, otherwise try to
	// derive it from the key and inject it as the endpoint parameter.
	if _, ok := rawParams["endpoint"]; !ok {
		if epAlias := findEndpointInKey(key); epAlias != "" {
			rawParams["endpoint"] = epAlias
		}
	}

	canonical, err := normalizeParamsCanonical(rawParams)
	if err != nil {
		return nil, false
	}

	return canonical, len(canonical) > 0
}

// CalculateCacheKey generates a deterministic cache key from request parameters.
// It first normalizes parameter names using the alias index (if initialized),
// then includes only the required parameters for that endpoint (plus endpoint itself)
// when building the cache key.
func CalculateCacheKey(params types.RequestParams) string {
	if len(params) == 0 {
		return ""
	}

	// Canonicalize parameters and filter to only required ones for keying.
	canonical, err := normalizeParamsCanonical(params)
	if err != nil {
		return ""
	}
	filtered := filterRequiredForKey(canonical)

	// Extract and sort keys for deterministic ordering
	keys := make([]string, 0, len(filtered))
	for key := range filtered {
		keys = append(keys, key)
	}
	sort.Strings(keys)

	// Build the cache key
	var parts []string
	for _, key := range keys {
		value := filtered[key]
		if value != "" {
			// Normalize both key and value for case-insensitive matching
			normalizedKey := NormalizeString(key)
			normalizedValue := NormalizeString(value)
			parts = append(parts, normalizedKey+"="+normalizedValue)
		}
	}

	return strings.Join(parts, ":")
}
