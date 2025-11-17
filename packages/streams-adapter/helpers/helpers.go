package helpers

import (
	"sort"
	"strings"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

// NormalizeString removes dashes and underscores for flexible matching
func NormalizeString(s string) string {
	s = strings.ReplaceAll(s, "-", "")
	s = strings.ReplaceAll(s, "_", "")
	return strings.ToLower(s)
}

// RequestParamsFromKey extracts RequestParams from a key
// Expected format: ADAPTER-{endpoint}-...{json_params}
// Returns the params extracted from the JSON portion of the key
func RequestParamsFromKey(key string) (types.RequestParams, bool) {
	// Extract endpoint from the key
	var endpoint string
	if strings.Contains(key, "crypto-lwba") {
		endpoint = "cryptolwba"
	} else {
		// Find substring between first and second dashes
		firstDash := strings.Index(key, "-")
		if firstDash != -1 {
			secondDash := strings.Index(key[firstDash+1:], "-")
			if secondDash != -1 {
				endpoint = key[firstDash+1 : firstDash+1+secondDash]
			}
		}
	}

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
	params := make(types.RequestParams)
	for k, v := range paramsMap {
		if strVal, ok := v.(string); ok {
			// Normalize parameter names: "base" -> "from", "quote" -> "to"
			paramKey := k
			switch k {
			case "base":
				paramKey = "from"
			case "quote":
				paramKey = "to"
			}
			params[paramKey] = strVal
		}
	}

	// Add endpoint to params if we found one (normalize to lowercase)
	if endpoint != "" {
		params["endpoint"] = strings.ToLower(endpoint)
	}

	return params, len(params) > 0
}

// CalculateCacheKey generates a deterministic cache key from request parameters
// Format: param1=value1:param2=value2:... (sorted alphabetically by parameter name)
func CalculateCacheKey(params types.RequestParams) string {
	if len(params) == 0 {
		return ""
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
			normalizedKey := NormalizeString(key)
			normalizedValue := NormalizeString(value)
			parts = append(parts, normalizedKey+"="+normalizedValue)
		}
	}

	return strings.Join(parts, ":")
}
