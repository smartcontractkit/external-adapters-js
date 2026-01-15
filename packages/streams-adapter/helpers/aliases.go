package helpers

import (
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

// Structures that mirror the JSON produced by readme_parser.go

type aliasParamSpec struct {
	Aliases  []string `json:"aliases,omitempty"`
	Required bool     `json:"required"`
}

type aliasEndpointConfig struct {
	Aliases []string                  `json:"aliases,omitempty"`
	Params  map[string]aliasParamSpec `json:"params,omitempty"`
}

type aliasAdapterConfig struct {
	Endpoints map[string]aliasEndpointConfig `json:"endpoints,omitempty"`
}

type aliasAllAdaptersConfig struct {
	Adapters map[string]aliasAdapterConfig `json:"adapters"`
}

// In-memory indices used at runtime for a single adapter.

type paramIndex struct {
	CanonicalName string
}

type adapterAliasIndex struct {
	// endpointAlias maps endpoint alias (lowercased) to canonical endpoint name
	// example:
	// {
	//    "stock":       "stock",
	//    "iex":         "stock",
	//    "crypto-lwba": "cryptolwba",
	//    "cryptolwba":  "crypto-lwba",
	//    "crypto_lwba": "crypto-lwba",
	//    "forex":       "forex",
	// }
	endpointAlias map[string]string
	// paramAlias maps input parameters to their canonical names
	// example:
	// {
	//    "stock": {
	// 	    "from":  {CanonicalName:"base",  Required:true},
	// 	    "base":  {CanonicalName:"base",  Required:true},
	// 	    "to":    {CanonicalName:"quote", Required:false},
	// 	    "quote": {CanonicalName:"quote", Required:false},
	// 	},
	// 	  "cryptolwba": {
	// 	 		"from":  {CanonicalName:"base",  Required:true},
	// 			"base":  {CanonicalName:"base",  Required:true},
	// 			"to":    {CanonicalName:"quote", Required:true},
	// 			"quote": {CanonicalName:"quote", Required:true},
	// 	}
	// }
	paramAlias map[string]map[string]paramIndex
	// requiredParams flags if a parameter is required for an endpoint. See axample above
	requiredParams map[string]map[string]bool
	// orderedEndpointAliases is a list of endpoint aliases sorted by length desc
	// for more specific matching when scanning Redis keys.
	orderedEndpointAliases []string
}

var (
	// Aliases index map for the adapter
	activeAliasIndex *adapterAliasIndex
	activeAdapter    string
)

// InitAliasIndex loads endpoint_aliases.json and builds alias indices for the given adapter.
func InitAliasIndex(adapterName, configPath string) error {
	if adapterName == "" {
		return fmt.Errorf("ADAPTER_NAME must be set to enable alias mapping")
	}

	if activeAliasIndex != nil && activeAdapter == adapterName {
		return nil
	}

	f, err := os.Open(configPath)
	if err != nil {
		return fmt.Errorf("failed to open alias config %s: %w", configPath, err)
	}
	defer f.Close()

	var all aliasAllAdaptersConfig
	if err := json.NewDecoder(f).Decode(&all); err != nil {
		return fmt.Errorf("failed to decode alias config: %w", err)
	}

	adapterCfg, ok := all.Adapters[adapterName]
	if !ok {
		return fmt.Errorf("adapter %q not found in alias config", adapterName)
	}

	idx := &adapterAliasIndex{
		endpointAlias:          make(map[string]string),
		paramAlias:             make(map[string]map[string]paramIndex),
		requiredParams:         make(map[string]map[string]bool),
		orderedEndpointAliases: []string{},
	}

	// Build endpoint alias index and parameter indices.
	for canonicalEndpoint, epCfg := range adapterCfg.Endpoints {

		// Ensure we always treat the canonical endpoint name as an alias of itself.
		idx.addEndpointAlias(canonicalEndpoint, canonicalEndpoint)
		for _, alias := range epCfg.Aliases {
			idx.addEndpointAlias(alias, canonicalEndpoint)
		}

		// Parameter specs.
		if epCfg.Params == nil {
			continue
		}

		if _, ok := idx.paramAlias[canonicalEndpoint]; !ok {
			idx.paramAlias[canonicalEndpoint] = make(map[string]paramIndex)
		}
		if _, ok := idx.requiredParams[canonicalEndpoint]; !ok {
			idx.requiredParams[canonicalEndpoint] = make(map[string]bool)
		}

		for canonicalParam, pSpec := range epCfg.Params {
			// Canonical name is also a valid alias.
			idx.paramAlias[canonicalEndpoint][canonicalParam] = paramIndex{CanonicalName: canonicalParam}
			idx.requiredParams[canonicalEndpoint][canonicalParam] = pSpec.Required

			for _, alias := range pSpec.Aliases {
				// Record alias -> canonical param mapping
				idx.paramAlias[canonicalEndpoint][alias] = paramIndex{CanonicalName: canonicalParam}
			}
		}
	}

	// Build ordered list of endpoint aliases by length (desc) for better matching.
	for alias := range idx.endpointAlias {
		idx.orderedEndpointAliases = append(idx.orderedEndpointAliases, alias)
	}
	sort.Slice(idx.orderedEndpointAliases, func(i, j int) bool {
		ai := idx.orderedEndpointAliases[i]
		aj := idx.orderedEndpointAliases[j]
		if len(ai) == len(aj) {
			return ai < aj
		}
		return len(ai) > len(aj)
	})

	activeAliasIndex = idx
	activeAdapter = adapterName
	return nil
}

// Adds endpoint alias to the alias index.
func (a *adapterAliasIndex) addEndpointAlias(alias, canonicalEndpoint string) {
	if alias == "" {
		return
	}
	// If already mapped, keep the first mapping to avoid surprises.
	if _, exists := a.endpointAlias[alias]; !exists {
		a.endpointAlias[alias] = canonicalEndpoint
	}
}

// findEndpointInKey attempts to find a canonical endpoint name for the active adapter
// by scanning the Redis key (OriginalAdapterKey) for any known endpoint aliases.
// It returns an error when the alias index is not initialized or when no matching
// endpoint alias can be found.
func findEndpointInKey(key string) (string, error) {
	if activeAliasIndex == nil {
		return "", fmt.Errorf("alias index not initialized")
	}
	lowerKey := strings.ToLower(key)

	// Limit the search to the portion before any JSON, to avoid matching inside values.
	if idx := strings.Index(lowerKey, "{"); idx != -1 {
		lowerKey = lowerKey[:idx]
	}

	for _, alias := range activeAliasIndex.orderedEndpointAliases {
		if strings.Contains(lowerKey, alias) {
			if canonical, ok := activeAliasIndex.endpointAlias[alias]; ok {
				return canonical, nil
			}
		}
	}
	return "", fmt.Errorf("could not derive endpoint from key %q", key)
}

// BuildCacheKeyParams converts raw request-like data into canonical RequestParams suitable for cache keying.
// It applies endpoint/parameter aliases and per-adapter overrides, then filters down
// to only those canonical parameters required for keying:
//   - always contains a canonical "endpoint"
//   - uses canonical parameter names for the active adapter
//   - contains only lowercased parameter values
//   - does NOT include the original "overrides" field (overrides are applied to values instead)
//   - omits non-required parameters for the endpoint
func BuildCacheKeyParams(data map[string]interface{}) (types.RequestParams, error) {
	out := make(types.RequestParams)

	// Resolve endpoint from the raw data (case-insensitive key lookup).
	var ep string
	for k, v := range data {
		if strings.EqualFold(k, "endpoint") {
			if s, ok := v.(string); ok {
				ep = s
			} else if v != nil {
				ep = fmt.Sprintf("%v", v)
			}
			break
		}
	}

	epLower := strings.ToLower(ep)

	// Resolve endpoint alias from the active alias index.
	if activeAliasIndex == nil {
		return nil, fmt.Errorf("alias index not initialized")
	}
	canonicalEndpoint, ok := activeAliasIndex.endpointAlias[epLower]
	if !ok || canonicalEndpoint == "" {
		return nil, fmt.Errorf("unknown or unsupported endpoint %q", ep)
	}

	out["endpoint"] = canonicalEndpoint

	// Handle overrides (if provided) directly from the decoded JSON structure.
	var adapterOverrides map[string]string
	if rawOverrides, ok := data["overrides"]; ok && rawOverrides != nil {
		if ov, ok := rawOverrides.(map[string]interface{}); ok {
			// Expected structure:
			// {
			//   "<adapterName>": {
			//     "<SYMBOL>": "<override>",
			//     ...
			//   },
			//   ...
			// }
			if perAdapterRaw, ok := ov[activeAdapter]; ok && perAdapterRaw != nil {
				if perAdapterMap, ok := perAdapterRaw.(map[string]interface{}); ok {
					adapterOverrides = make(map[string]string, len(perAdapterMap))
					for symbol, overrideVal := range perAdapterMap {
						if o, ok := overrideVal.(string); ok && o != "" {
							adapterOverrides[strings.ToUpper(symbol)] = o
						}
					}
				}
			}
		}
	}

	// Normalize all other parameters through the alias index if available.
	// Also, filter to only those canonical parameters that are required for this endpoint
	// when we have requirement metadata.
	requiredForEndpoint, haveReq := activeAliasIndex.requiredParams[canonicalEndpoint]

	for k, v := range data {
		// Ignore the `endpoint` and `overrides` keys.
		if strings.EqualFold(k, "endpoint") || strings.EqualFold(k, "overrides") || v == nil {
			continue
		}

		keyLower := strings.ToLower(k)

		// Convert value to string.
		var rawValue string
		switch tv := v.(type) {
		case string:
			rawValue = tv
		default:
			rawValue = fmt.Sprintf("%v", tv)
		}
		if rawValue == "" {
			continue
		}

		value := rawValue

		// If there are per-adapter overrides, and the current value has an
		// override defined for the active adapter, use the override instead.
		if adapterOverrides != nil {
			if ov, ok := adapterOverrides[strings.ToUpper(rawValue)]; ok && ov != "" {
				value = ov
			}
		}

		valueUpper := strings.ToUpper(value)

		canonicalKey := keyLower
		if pm, ok := activeAliasIndex.paramAlias[canonicalEndpoint]; ok {
			if pIdx, ok := pm[keyLower]; ok {
				canonicalKey = pIdx.CanonicalName
			}
		}

		// If we don't have requirement metadata for this endpoint, keep all params.
		if !haveReq {
			out[canonicalKey] = valueUpper
			continue
		}

		// Otherwise, only keep parameters that are marked as required.
		if required, ok := requiredForEndpoint[canonicalKey]; ok && required {
			out[canonicalKey] = valueUpper
		}
	}

	return out, nil
}
