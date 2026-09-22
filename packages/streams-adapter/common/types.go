package types

import (
	"bytes"
	"time"

	"github.com/goccy/go-json"
)

// RequestParams represents dynamic request parameters
// All request parameters are treated equally (endpoint, base, quote, isin, market, fundId, etc.)
type RequestParams map[string]string

// ResolvedSubscription contains the identifiers derived from subscription data.
// It can be validated without mutating the cache and then passed to the shared
// cache/bootstrap initialization path.
type ResolvedSubscription struct {
	Data        map[string]interface{}
	Params      RequestParams
	CacheKey    string
	PayloadHash [32]byte
}

// Observation represents the data returned from an adapter
type Observation struct {
	Data       json.RawMessage `json:"data"`
	Timestamps json.RawMessage `json:"timestamps"`
	Meta       json.RawMessage `json:"meta"`
	Success    bool            `json:"success"`
	Error      string          `json:"error,omitempty"`
	StatusCode int             `json:"statusCode,omitempty"`
	Result     json.RawMessage `json:"result"`
}

// MetaInjector appends adapterVersion and proto to an observation's meta object.
// The serialized field suffix is computed once so per-observation injection only
// splices bytes and never marshals the meta contents.
type MetaInjector struct {
	suffix []byte // e.g. `"adapterVersion":"2.14.1","proto":"grpc"`
}

// NewMetaInjector builds an injector with a pre-serialized field suffix.
func NewMetaInjector(adapterVersion, proto string) *MetaInjector {
	av, _ := json.Marshal(adapterVersion)
	p, _ := json.Marshal(proto)
	suffix := make([]byte, 0, len(av)+len(p)+len(`"adapterVersion":,"proto":`))
	suffix = append(suffix, `"adapterVersion":`...)
	suffix = append(suffix, av...)
	suffix = append(suffix, `,"proto":`...)
	suffix = append(suffix, p...)
	return &MetaInjector{suffix: suffix}
}

// Apply returns a shallow copy of obs with the meta fields spliced in. The
// original observation is not modified.
func (i *MetaInjector) Apply(obs *Observation) *Observation {
	cp := *obs

	inner := bytes.TrimSpace(obs.Meta)
	if len(inner) == 0 || inner[0] != '{' {
		inner = []byte("{}")
	}
	content := bytes.TrimSpace(inner[1 : len(inner)-1])

	out := make([]byte, 0, len(content)+len(i.suffix)+3)
	out = append(out, '{')
	out = append(out, content...)
	if len(content) > 0 {
		out = append(out, ',')
	}
	out = append(out, i.suffix...)
	out = append(out, '}')
	cp.Meta = out

	return &cp
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
	Status              CacheItemStatus
	TransformedKey      string                 // populated once StatusLearned or StatusActive
	RequiresInverse     bool                   // true when the original request is the inverse of TransformedKey
	Observation         *Observation           // populated once StatusActive
	Timestamp           time.Time              // last write time (used for TTL)
	OriginalAdapterKey  string                 // JS adapter Redis key; populated once StatusActive
	OriginalRequestData map[string]interface{} // raw request body data from the first subscription request
	PayloadHashes       map[[32]byte]struct{}  // all SHA-256 hashes (adapter name || JSON request data) registered for this raw key
}
