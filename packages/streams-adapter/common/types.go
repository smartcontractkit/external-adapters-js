package types

import (
	"time"

	"github.com/goccy/go-json"
)

// RequestParams represents dynamic request parameters
// All request parameters are treated equally (endpoint, base, quote, isin, market, fundId, etc.)
type RequestParams map[string]string

// Observation represents the data returned from an adapter
type Observation struct {
	Data       json.RawMessage `json:"data"`
	Timestamps json.RawMessage `json:"timestamps"`
	Meta       json.RawMessage `json:"meta"`
	Success    bool            `json:"success"`
	Error      string          `json:"error,omitempty"`
}

// CacheItemStatus tracks the lifecycle of a cache item.
type CacheItemStatus string

const (
	// StatusNew is set when the first client request arrives and a subscription
	// is being initiated. No observation data is available yet.
	StatusNew CacheItemStatus = "new"
	// StatusLearned is set when the raw→transformed key mapping has been learned
	// from the JS adapter's feedId response. Still waiting for the first observation.
	StatusLearned CacheItemStatus = "learned"
	// StatusActive is set once the first observation has been received via the
	// Redcon EVAL handler and live data is flowing.
	StatusActive CacheItemStatus = "active"
)

// CacheItem represents a cached value with metadata
type CacheItem struct {
	Status             CacheItemStatus
	TransformedKey     string       // populated once StatusLearned or StatusActive
	Observation        *Observation // populated once StatusActive
	Timestamp          time.Time    // last write time (used for TTL)
	OriginalAdapterKey string       // JS adapter Redis key; populated once StatusActive
}
