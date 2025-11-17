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
	Data    json.RawMessage `json:"data"`
	Success bool            `json:"success"`
	Error   string          `json:"error,omitempty"`
}

// CacheItem represents a cached value with metadata
type CacheItem struct {
	Observation *Observation
	Timestamp   time.Time // Last write time
}

// Cache interface for storing and retrieving observations
type Cache interface {
	Set(params RequestParams, observation *Observation, timestamp time.Time)
	Get(params RequestParams) *Observation
}

// Config interface for configuration management
type Config interface {
	Set(string, any)
	Get(string) any
}

// Server interface
type Server interface {
	Start() error
	Close() error
}
