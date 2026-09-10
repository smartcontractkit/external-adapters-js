package client

import (
	"sync"
	"time"
)

const rateWindow = 10 * time.Second

// CacheEntry holds the latest observation for a payload hash.
type CacheEntry struct {
	ObservationJSON []byte
	UpdatedAt       time.Time
	Count           uint64
	recentTimes     []time.Time // timestamps of recent events within rateWindow
}

// Cache is a thread-safe in-memory store keyed by lowercase payload hash.
type Cache struct {
	mu    sync.RWMutex
	items map[string]*CacheEntry
}

// NewCache creates a new empty Cache.
func NewCache() *Cache {
	return &Cache{items: make(map[string]*CacheEntry)}
}

// Set stores the latest observation for payloadHash.
func (c *Cache) Set(payloadHash string, obsJSON []byte, ts time.Time) {
	c.mu.Lock()
	defer c.mu.Unlock()

	entry, ok := c.items[payloadHash]
	if !ok {
		entry = &CacheEntry{}
		c.items[payloadHash] = entry
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

// Rate returns the rolling messages-per-second over the last 10 s for payloadHash.
func (c *Cache) Rate(payloadHash string) float64 {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, ok := c.items[payloadHash]
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

// Get returns a copy of the entry for payloadHash plus an ok flag.
func (c *Cache) Get(payloadHash string) (CacheEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()
	entry, ok := c.items[payloadHash]
	if !ok {
		return CacheEntry{}, false
	}
	return *entry, true
}

// All returns a shallow copy of all entries keyed by payload hash.
func (c *Cache) All() map[string]CacheEntry {
	c.mu.RLock()
	defer c.mu.RUnlock()
	result := make(map[string]CacheEntry, len(c.items))
	for k, v := range c.items {
		result[k] = *v
	}
	return result
}
