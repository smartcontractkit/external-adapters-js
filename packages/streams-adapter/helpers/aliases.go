package helpers

import (
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

// aliasConfig mirrors the JSON produced by the endpoint alias generator.
type aliasConfig struct {
	Adapters map[string]struct {
		DefaultEndpoint string `json:"defaultEndpoint,omitempty"`
		Endpoints       map[string]struct {
			Aliases []string `json:"aliases,omitempty"`
		} `json:"endpoints,omitempty"`
	} `json:"adapters"`
}

// endpointIndex is the runtime lookup table for a single adapter.
type endpointIndex struct {
	// alias maps lowercased endpoint alias → canonical endpoint name
	alias map[string]string
	// ordered lists aliases sorted by length desc for longest-match scanning of Redis keys
	ordered []string
	// defaultEndpoint is the canonical endpoint name to use when none is specified in a request
	defaultEndpoint string
}

var (
	activeIndex   *endpointIndex
	activeAdapter string
)

// InitAliasIndex loads endpoint_aliases.json and builds alias indices for the given adapter.
func InitAliasIndex(adapterName, configPath string) error {
	if adapterName == "" {
		return fmt.Errorf("ADAPTER_NAME must be set to enable alias mapping")
	}

	if activeIndex != nil && activeAdapter == adapterName {
		return nil
	}

	f, err := os.Open(configPath)
	if err != nil {
		return fmt.Errorf("failed to open alias config %s: %w", configPath, err)
	}
	defer f.Close()

	var cfg aliasConfig
	if err := json.NewDecoder(f).Decode(&cfg); err != nil {
		return fmt.Errorf("failed to decode alias config: %w", err)
	}

	adapterCfg, ok := cfg.Adapters[adapterName]
	if !ok {
		return fmt.Errorf("adapter %q not found in alias config", adapterName)
	}

	idx := &endpointIndex{
		alias:           make(map[string]string),
		defaultEndpoint: strings.ToLower(adapterCfg.DefaultEndpoint),
	}

	for canonical, epCfg := range adapterCfg.Endpoints {
		idx.addAlias(canonical, canonical)
		for _, a := range epCfg.Aliases {
			idx.addAlias(a, canonical)
		}
	}

	// Build ordered list sorted by length desc for longest-match scanning.
	idx.ordered = make([]string, 0, len(idx.alias))
	for a := range idx.alias {
		idx.ordered = append(idx.ordered, a)
	}
	sort.Slice(idx.ordered, func(i, j int) bool {
		if len(idx.ordered[i]) == len(idx.ordered[j]) {
			return idx.ordered[i] < idx.ordered[j]
		}
		return len(idx.ordered[i]) > len(idx.ordered[j])
	})

	activeIndex = idx
	activeAdapter = adapterName
	return nil
}

// toString converts an interface{} value to its string representation.
func toString(v interface{}) string {
	if s, ok := v.(string); ok {
		return s
	}
	if v == nil {
		return ""
	}
	return fmt.Sprintf("%v", v)
}

func (idx *endpointIndex) addAlias(alias, canonical string) {
	if alias == "" {
		return
	}
	if _, exists := idx.alias[alias]; !exists {
		idx.alias[alias] = canonical
	}
}

// findEndpointInKey attempts to find a canonical endpoint name for the active adapter
// by scanning the Redis key (OriginalAdapterKey) for any known endpoint aliases.
func findEndpointInKey(key string) (string, error) {
	if activeIndex == nil {
		panic("alias index not initialized: InitAliasIndex must be called before processing requests")
	}
	lowerKey := strings.ToLower(key)

	if idx := strings.Index(lowerKey, "{"); idx != -1 {
		lowerKey = lowerKey[:idx]
	}

	for _, a := range activeIndex.ordered {
		if strings.Contains(lowerKey, a) {
			if canonical, ok := activeIndex.alias[a]; ok {
				return canonical, nil
			}
		}
	}
	return "", fmt.Errorf("could not derive endpoint from key %q", key)
}

// BuildCacheKeyParams converts raw request-like data into canonical RequestParams
// suitable for cache keying. It resolves endpoint aliases only and passes through
// all other parameters as-is (lowercased keys, uppercased values).
func BuildCacheKeyParams(data map[string]interface{}) (types.RequestParams, error) {
	out := make(types.RequestParams)

	var ep string
	for k, v := range data {
		if strings.EqualFold(k, "endpoint") {
			ep = toString(v)
			break
		}
	}

	if activeIndex == nil {
		panic("alias index not initialized: InitAliasIndex must be called before processing requests")
	}
	canonicalEndpoint, ok := activeIndex.alias[strings.ToLower(ep)]
	if !ok || canonicalEndpoint == "" {
		if ep == "" && activeIndex.defaultEndpoint != "" {
			canonicalEndpoint = activeIndex.defaultEndpoint
		} else {
			return nil, fmt.Errorf("unknown or unsupported endpoint %q", ep)
		}
	}

	out["endpoint"] = canonicalEndpoint

	for k, v := range data {
		if strings.EqualFold(k, "endpoint") || strings.EqualFold(k, "overrides") || v == nil {
			continue
		}
		value := toString(v)
		if value == "" {
			continue
		}
		out[strings.ToLower(k)] = strings.ToUpper(value)
	}

	// Apply adapter-specific symbol overrides so the cache key reflects the
	// actual symbol the JS adapter will subscribe to. Without this, requests
	// that map a symbol via overrides (e.g. CRCL → CRCL.xnys) would produce
	// the same cache key as requests for the raw symbol, causing incorrect
	// resubscription payloads to be stored and used.
	if overridesRaw, ok := data["overrides"]; ok {
		if overridesMap, ok := overridesRaw.(map[string]interface{}); ok {
			for adapterKey, adapterOverridesRaw := range overridesMap {
				if !strings.EqualFold(adapterKey, activeAdapter) {
					continue
				}
				adapterOverrides, ok := adapterOverridesRaw.(map[string]interface{})
				if !ok {
					break
				}
				for paramKey, paramVal := range out {
					if paramKey == "endpoint" {
						continue
					}
					for overrideKey, overrideVal := range adapterOverrides {
						if strings.EqualFold(overrideKey, paramVal) {
							out[paramKey] = strings.ToUpper(toString(overrideVal))
							break
						}
					}
				}
				break
			}
		}
	}

	return out, nil
}
