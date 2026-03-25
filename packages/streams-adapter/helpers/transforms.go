package helpers

import (
	types "streams-adapter/common"
)

// CacheKeyTransformFunc transforms canonical request params for cache keying.
// It receives the already-canonicalized params (with overrides applied) and a set
// of canonical param names whose values were changed by adapter overrides.
type CacheKeyTransformFunc func(params types.RequestParams, overriddenKeys map[string]bool)

// adapterTransforms maps adapter name to its cache key transform function.
// To add support for a new adapter, define a transform function and register it here.
var adapterTransforms = map[string]CacheKeyTransformFunc{
	"cfbenchmarks": cfbenchmarksTransform,
}

// cfbenchmarksTransform computes a CFBenchmarks index from base/quote and removes
// the individual base/quote params so the cache key uses only the index.
// Applies to the "crypto" and "crypto-lwba" endpoints.
func cfbenchmarksTransform(params types.RequestParams, overriddenKeys map[string]bool) {
	endpoint := params["endpoint"]
	if endpoint != "crypto" && endpoint != "crypto-lwba" {
		return
	}

	base, hasBase := params["base"]
	if !hasBase {
		return
	}

	if overriddenKeys["base"] {
		params["index"] = base
	} else if _, hasIndex := params["index"]; !hasIndex {
		quote := params["quote"]
		params["index"] = "U_" + base + quote + "_RTI"
	}
	params["adapterNameOverride"] = "cfbenchmarks2"
	delete(params, "base")
	delete(params, "quote")
}
