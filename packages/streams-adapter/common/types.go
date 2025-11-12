package types

import (
	"time"

	"github.com/goccy/go-json"
)

// DataProvider interface
type DataProvider interface {
	Start() error
	Close() error
	Subscribe(assetPair AssetPair)
	IsConnected() error
	GetSubscriptions() []AssetPair
}

// Observation
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

type Cache interface {
	Set(assetPair AssetPair, observation *Observation, timestamp time.Time)
	Get(assetPair AssetPair) *Observation
}

type Config interface {
	Set(string, any)
	Get(string) any
}

type AssetPair struct {
	Base     string
	Quote    string
	Endpoint string
}

// Server interface
type Server interface {
	Start() error
	Close() error
}
