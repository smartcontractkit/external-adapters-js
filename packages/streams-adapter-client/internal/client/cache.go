package client

import (
	"sync"
	"time"
)

const rateWindow = 60 * time.Second

// CacheEntry holds the latest observation for an asset plus rate-tracking state.
type CacheEntry struct {
	ObservationJSON []byte
	UpdatedAt       time.Time
	Count           uint64
	recentTimes     []time.Time // timestamps of recent events within rateWindow
}

// Cache is a thread-safe in-memory store for the latest observation per asset.
type Cache struct {
	mu    sync.RWMutex
	items map[string]*CacheEntry
}

// NewCache creates a new empty Cache.
func NewCache() *Cache {
	return &Cache{items: make(map[string]*CacheEntry)}
}

// Set stores the latest observation for assetID and records ts for rate calculation.
func (c *Cache) Set(assetID string, obsJSON []byte, ts time.Time) {
	c.mu.Lock()
	defer c.mu.Unlock()

	entry, ok := c.items[assetID]
	if !ok {
		entry = &CacheEntry{}
		c.items[assetID] = entry
	}
	entry.ObservationJSON = obsJSON
	entry.UpdatedAt = ts
	entry.Count++

	// Append and trim to rateWindow
	entry.recentTimes = append(entry.recentTimes, ts)
	cutoff := ts.Add(-rateWindow)
	i := 0
	for i < len(entry.recentTimes) && entry.recentTimes[i].Before(cutoff) {
		i++
	}
	entry.recentTimes = entry.recentTimes[i:]
}

// Rate returns the rolling messages-per-second over the last 60 s for assetID.
func (c *Cache) Rate(assetID string) float64 {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, ok := c.items[assetID]
	if !ok {
		return 0
	}
	cutoff := time.Now().Add(-rateWindow)
	count := 0
	for _, t := range entry.recentTimes {
		if !t.Before(cutoff) {
			count++
		}
	}
	return float64(count) / rateWindow.Seconds()
}

// Get returns a copy of the entry for assetID plus an ok flag.
func (c *Cache) Get(assetID string) (CacheEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.items[assetID]
	if !ok {
		return CacheEntry{}, false
	}
	return *entry, true
}

// All returns a shallow copy of all entries keyed by asset ID.
func (c *Cache) All() map[string]CacheEntry {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make(map[string]CacheEntry, len(c.items))
	for k, v := range c.items {
		result[k] = *v
	}
	return result
}
