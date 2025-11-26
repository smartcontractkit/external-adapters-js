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
func findEndpointInKey(key string) string {
	if activeAliasIndex == nil {
		return ""
	}
	lowerKey := strings.ToLower(key)

	// Limit the search to the portion before any JSON, to avoid matching inside values.
	if idx := strings.Index(lowerKey, "{"); idx != -1 {
		lowerKey = lowerKey[:idx]
	}

	for _, alias := range activeAliasIndex.orderedEndpointAliases {
		if strings.Contains(lowerKey, alias) {
			if canonical, ok := activeAliasIndex.endpointAlias[alias]; ok {
				return canonical
			}
		}
	}
	return ""
}

// normalizeParamsCanonical takes RequestParams and looks up the canonicall endpoint and input parameters
func normalizeParamsCanonical(params types.RequestParams) (types.RequestParams, error) {
	out := make(types.RequestParams)

	ep, ok := params["endpoint"]
	if !ok || strings.TrimSpace(ep) == "" {
		return nil, fmt.Errorf("endpoint parameter is required")
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

	// Handle overrides (if provided).
	var adapterOverrides map[string]string
	if rawOverrides, ok := params["overrides"]; ok && strings.TrimSpace(rawOverrides) != "" {
		var allOverrides map[string]map[string]string
		if err := json.Unmarshal([]byte(rawOverrides), &allOverrides); err == nil {
			if perAdapter, ok := allOverrides[activeAdapter]; ok {
				adapterOverrides = make(map[string]string, len(perAdapter))
				for symbol, override := range perAdapter {
					adapterOverrides[strings.ToLower(symbol)] = override
				}
			}
		}
	}

	// Normalize all other parameters through the alias index if available.
	for k, v := range params {

		// ignore the `endpoint` and `overrides` keys
		if k == "endpoint" || k == "overrides" || v == "" {
			continue
		}

		keyLower := strings.ToLower(k)
		value := v

		// If there are per-adapter overrides, and the current value has an
		// override defined for the active adapter, use the override instead.
		if adapterOverrides != nil {
			if ov, ok := adapterOverrides[strings.ToLower(v)]; ok && ov != "" {
				value = ov
			}
		}

		valueLower := strings.ToLower(value)

		canonicalKey := keyLower
		if pm, ok := activeAliasIndex.paramAlias[canonicalEndpoint]; ok {
			if pIdx, ok := pm[keyLower]; ok {
				canonicalKey = pIdx.CanonicalName
			}
		}
		out[canonicalKey] = valueLower
	}

	return out, nil
}

// filterRequiredForKey builds a filtered copy of params that contains:
//   - endpoint
//   - only those canonical parameters that are marked as Required for this endpoint.
//
// If alias indices are not initialized or endpoint is unknown, it conservatively
// keeps all params instead of dropping anything.
func filterRequiredForKey(params types.RequestParams) types.RequestParams {
	if activeAliasIndex == nil {
		return params
	}

	endpoint, ok := params["endpoint"]
	if !ok || endpoint == "" {
		return params
	}
	endpoint = strings.ToLower(endpoint)

	requiredForEndpoint, ok := activeAliasIndex.requiredParams[endpoint]
	if !ok {
		return params
	}

	out := make(types.RequestParams)
	// Always include canonical endpoint.
	out["endpoint"] = endpoint

	for k, v := range params {
		if k == "endpoint" || v == "" {
			continue
		}
		if required, ok := requiredForEndpoint[k]; ok && required {
			out[k] = v
		}
	}
	return out
}
