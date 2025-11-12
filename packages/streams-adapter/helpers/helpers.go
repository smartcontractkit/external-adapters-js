package helpers

import (
	"strings"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

// FindKeyByAssetPair searches for a key in the given map that matches
// the specified asset pair (endpoint, base, and quote).
// It returns the matching key and true if found, or empty string and false if not found.
func FindKeyByAssetPair(keys map[string]interface{}, assetPair types.AssetPair) (string, bool) {
	for key := range keys {
		if matchesKey(key, assetPair) {
			return key, true
		}
	}
	return "", false
}

// matchesKey checks if a key matches the given asset pair
func matchesKey(key string, assetPair types.AssetPair) bool {
	// Check if the key contains the endpoint
	// Expected format: TIINGO-{endpoint}-...{json}
	if !strings.Contains(key, assetPair.Endpoint) {
		return false
	}

	// Extract base and quote from the key
	base, quote, ok := extractBaseQuoteFromKey(key)
	if !ok {
		return false
	}

	// Compare base and quote (case-insensitive)
	return strings.EqualFold(base, assetPair.Base) && strings.EqualFold(quote, assetPair.Quote)
}

// Known endpoints that can be extended as needed
// Each endpoint can have multiple variations (with dashes, underscores, or no separators)
var knownEndpoints = []string{
	"crypto-lwba",
	"forex",
	"stocks",

	// Add more endpoints here as needed
}

// NormalizeString removes dashes and underscores for flexible matching
func NormalizeString(s string) string {
	s = strings.ReplaceAll(s, "-", "")
	s = strings.ReplaceAll(s, "_", "")
	return strings.ToLower(s)
}

// extractBaseQuoteFromKey extracts the base and quote from a key's JSON portion
// Returns base, quote, and true if successful; empty strings and false otherwise
func extractBaseQuoteFromKey(key string) (base string, quote string, ok bool) {
	// Find the JSON portion of the key (starts with '{' and ends with '}')
	jsonStart := strings.Index(key, "{")
	jsonEnd := strings.LastIndex(key, "}")

	if jsonStart == -1 || jsonEnd == -1 || jsonEnd <= jsonStart {
		return "", "", false
	}

	jsonStr := key[jsonStart : jsonEnd+1]

	// Parse the JSON to extract base and quote
	var pairInfo struct {
		Base  string `json:"base"`
		Quote string `json:"quote"`
	}
	if err := json.Unmarshal([]byte(jsonStr), &pairInfo); err != nil {
		return "", "", false
	}

	return pairInfo.Base, pairInfo.Quote, true
}

// AssetPairFromKey extracts an AssetPair from a key
func AssetPairFromKey(key string) (types.AssetPair, bool) {
	// Extract base and quote from the key
	base, quote, ok := extractBaseQuoteFromKey(key)
	if !ok {
		return types.AssetPair{}, false
	}

	// Find the endpoint from the known endpoints list
	endpoint := extractEndpoint(key)
	if endpoint == "" {
		return types.AssetPair{}, false
	}

	return types.AssetPair{
		Base:     base,
		Quote:    quote,
		Endpoint: endpoint,
	}, true
}

// extractEndpoint finds the first matching endpoint from knownEndpoints in the key
// Matches endpoints flexibly, handling variations with dashes, underscores, or no separators
// Returns the canonical endpoint name from knownEndpoints
func extractEndpoint(key string) string {
	// TODO: refactor this mess
	normalizedKey := NormalizeString(key)

	for _, endpoint := range knownEndpoints {
		normalizedEndpoint := NormalizeString(endpoint)
		if strings.Contains(normalizedKey, normalizedEndpoint) {
			return NormalizeString(endpoint)
		}
	}
	return ""
}

func CalculateCacheKey(assetPair types.AssetPair) string {
	return NormalizeString(assetPair.Base) + "-" + NormalizeString(assetPair.Quote) + "-" + NormalizeString(assetPair.Endpoint)
}
