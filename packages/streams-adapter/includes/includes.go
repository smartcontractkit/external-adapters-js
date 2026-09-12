package includes

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
)

// IncludeDetails mirrors the include object inside an adapter_includes.json entry.
type IncludeDetails struct {
	Inverse bool `json:"inverse"`
}

// AdapterIncludes maps original pair (from -> to) to include details for one adapter.
type AdapterIncludes map[string]map[string]IncludeDetails

// Config mirrors the top-level structure of adapter_includes.json.
type Config struct {
	Adapters map[string]AdapterIncludes `json:"adapters"`
}

// Index provides fast lookup of the include details for a single adapter's pairs.
type Index struct {
	entries map[string]map[string]IncludeDetails
}

// Load reads adapter_includes.json and returns the index for the named adapter.
func Load(path, adapterName string) (*Index, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open adapter includes config %q: %w", path, err)
	}
	defer f.Close()

	var cfg Config
	if err := json.NewDecoder(f).Decode(&cfg); err != nil {
		return nil, fmt.Errorf("decode adapter includes config %q: %w", path, err)
	}

	adapterIncludes, ok := cfg.Adapters[adapterName]
	if !ok {
		return nil, fmt.Errorf("adapter %q not found in adapter includes config %q", adapterName, path)
	}

	return NewIndex(adapterIncludes), nil
}

// NewIndex builds an index from a parsed adapter includes map.
func NewIndex(adapterIncludes AdapterIncludes) *Index {
	idx := &Index{entries: make(map[string]map[string]IncludeDetails)}
	for from, toMap := range adapterIncludes {
		upperFrom := strings.ToUpper(from)
		if upperFrom == "" {
			continue
		}
		if idx.entries[upperFrom] == nil {
			idx.entries[upperFrom] = make(map[string]IncludeDetails)
		}
		for to, details := range toMap {
			upperTo := strings.ToUpper(to)
			if upperTo == "" {
				continue
			}
			idx.entries[upperFrom][upperTo] = details
		}
	}
	return idx
}

// Lookup returns the include details for a requested pair (case-insensitive).
func (idx *Index) Lookup(from, to string) (IncludeDetails, bool) {
	if idx == nil || idx.entries == nil {
		return IncludeDetails{}, false
	}
	m, ok := idx.entries[strings.ToUpper(from)]
	if !ok {
		return IncludeDetails{}, false
	}
	d, ok := m[strings.ToUpper(to)]
	return d, ok
}
