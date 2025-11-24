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
	// endpointAlias maps endpoint alias (lowercased) -> canonical endpoint name
	endpointAlias map[string]string
	// paramAlias maps canonical endpoint -> param alias (lowercased) -> paramIndex
	paramAlias map[string]map[string]paramIndex
	// requiredParams maps canonical endpoint -> canonical param name -> required?
	requiredParams map[string]map[string]bool
	// orderedEndpointAliases is a list of endpoint aliases sorted by length desc
	// for more specific matching when scanning Redis keys.
	orderedEndpointAliases []string
}

var (
	activeAliasIndex *adapterAliasIndex
	activeAdapter    string
)

// InitAliasIndex loads endpoint_aliases.json and builds alias indices for the given adapter.
func InitAliasIndex(adapterName, configPath string) error {
	adapterName = strings.ToLower(strings.TrimSpace(adapterName))
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
		canonicalEndpointLower := strings.ToLower(canonicalEndpoint)

		// Ensure we always treat the canonical endpoint name as an alias of itself.
		idx.addEndpointAlias(canonicalEndpointLower, canonicalEndpointLower)
		for _, alias := range epCfg.Aliases {
			aliasLower := strings.ToLower(alias)
			idx.addEndpointAlias(aliasLower, canonicalEndpointLower)
		}

		// Parameter specs.
		if epCfg.Params == nil {
			continue
		}

		if _, ok := idx.paramAlias[canonicalEndpointLower]; !ok {
			idx.paramAlias[canonicalEndpointLower] = make(map[string]paramIndex)
		}
		if _, ok := idx.requiredParams[canonicalEndpointLower]; !ok {
			idx.requiredParams[canonicalEndpointLower] = make(map[string]bool)
		}

		for canonicalParam, pSpec := range epCfg.Params {
			canonicalParamLower := strings.ToLower(canonicalParam)
			// Canonical name is also a valid alias.
			idx.paramAlias[canonicalEndpointLower][canonicalParamLower] = paramIndex{CanonicalName: canonicalParamLower}
			idx.requiredParams[canonicalEndpointLower][canonicalParamLower] = pSpec.Required

			for _, alias := range pSpec.Aliases {
				aliasLower := strings.ToLower(alias)
				// Record alias -> canonical param mapping
				idx.paramAlias[canonicalEndpointLower][aliasLower] = paramIndex{CanonicalName: canonicalParamLower}
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

func (a *adapterAliasIndex) addEndpointAlias(aliasLower, canonicalEndpoint string) {
	if aliasLower == "" {
		return
	}
	// If already mapped, keep the first mapping to avoid surprises.
	if _, exists := a.endpointAlias[aliasLower]; !exists {
		a.endpointAlias[aliasLower] = canonicalEndpoint
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

// normalizeParamsCanonical takes arbitrary params and an optional canonical endpoint
// and returns a new RequestParams map with:
//   - endpoint normalized to its canonical name (if known)
//   - parameter names normalized to their canonical names according to alias config.
func normalizeParamsCanonical(params types.RequestParams, endpointCanonical string) types.RequestParams {
	out := make(types.RequestParams)

	// Normalize endpoint if present in params or provided explicitly.
	if ep, ok := params["endpoint"]; ok && ep != "" {
		epLower := strings.ToLower(ep)
		if activeAliasIndex != nil {
			if canonical := resolveEndpointAlias(epLower); canonical != "" {
				endpointCanonical = canonical
			} else {
				endpointCanonical = epLower
			}
		} else {
			endpointCanonical = epLower
		}
	}

	if endpointCanonical != "" {
		out["endpoint"] = endpointCanonical
	}

	// Normalize all other parameters through the alias index if available.
	for k, v := range params {
		if k == "endpoint" || v == "" {
			continue
		}
		keyLower := strings.ToLower(k)
		valueLower := strings.ToLower(v)

		canonicalKey := keyLower
		if activeAliasIndex != nil && endpointCanonical != "" {
			if pm, ok := activeAliasIndex.paramAlias[endpointCanonical]; ok {
				if pIdx, ok := pm[keyLower]; ok {
					canonicalKey = pIdx.CanonicalName
				}
			}
		}
		out[canonicalKey] = valueLower
	}

	return out
}

func resolveEndpointAlias(alias string) string {
	if activeAliasIndex == nil {
		return ""
	}
	if canonical, ok := activeAliasIndex.endpointAlias[alias]; ok {
		return canonical
	}
	return ""
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
