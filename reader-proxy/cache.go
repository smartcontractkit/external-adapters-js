package main

import (
	"sync"
	"time"
)

// CacheEntry represents a cached item with expiration
type CacheEntry struct {
	Value      []byte
	StatusCode int
	Headers    map[string]string
	ExpiresAt  time.Time
}

// IsExpired checks if the cache entry has expired
func (e *CacheEntry) IsExpired() bool {
	return time.Now().After(e.ExpiresAt)
}

// Cache provides a thread-safe cache with TTL support
type Cache struct {
	mu              sync.RWMutex
	items           map[string]*CacheEntry
	ttl             time.Duration
	cleanupInterval time.Duration
	stopCleanup     chan struct{}

	// Metrics
	hits   uint64
	misses uint64
}

// NewCache creates a new cache with the specified TTL and cleanup interval
func NewCache(ttl, cleanupInterval time.Duration) *Cache {
	c := &Cache{
		items:           make(map[string]*CacheEntry),
		ttl:             ttl,
		cleanupInterval: cleanupInterval,
		stopCleanup:     make(chan struct{}),
	}

	// Start cleanup goroutine
	go c.cleanupLoop()

	return c
}

// Get retrieves a value from the cache
func (c *Cache) Get(key string) (*CacheEntry, bool) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	entry, found := c.items[key]
	if !found {
		c.misses++
		return nil, false
	}

	if entry.IsExpired() {
		c.misses++
		return nil, false
	}

	c.hits++
	return entry, true
}

// Set stores a value in the cache with TTL
func (c *Cache) Set(key string, value []byte, statusCode int, headers map[string]string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	c.items[key] = &CacheEntry{
		Value:      value,
		StatusCode: statusCode,
		Headers:    headers,
		ExpiresAt:  time.Now().Add(c.ttl),
	}
}

// Delete removes a value from the cache
func (c *Cache) Delete(key string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	delete(c.items, key)
}

// Size returns the number of items in the cache
func (c *Cache) Size() int {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return len(c.items)
}

// GetMetrics returns cache hit/miss statistics
func (c *Cache) GetMetrics() (hits, misses uint64, size int) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return c.hits, c.misses, len(c.items)
}

// cleanupLoop periodically removes expired entries
func (c *Cache) cleanupLoop() {
	ticker := time.NewTicker(c.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.cleanup()
		case <-c.stopCleanup:
			return
		}
	}
}

// cleanup removes expired entries from the cache
func (c *Cache) cleanup() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, entry := range c.items {
		if now.After(entry.ExpiresAt) {
			delete(c.items, key)
		}
	}
}

// Stop halts the cleanup goroutine
func (c *Cache) Stop() {
	close(c.stopCleanup)
}
