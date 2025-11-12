package cache

import (
	"context"
	"sync"
	"time"

	types "streams-adapter/common"
	helpers "streams-adapter/helpers"
)

var _ types.Cache = (*Cache)(nil)

// Config holds cache configuration
type Config struct {
	MaxSize         int           // Maximum number of items
	TTL             time.Duration // Time-to-live for items
	CleanupInterval time.Duration // How often to run cleanup
}

// Cache represents an in-memory cache for observation data
type Cache struct {
	mu              sync.RWMutex
	items           map[string]*types.CacheItem
	maxSize         int
	ttl             time.Duration
	cleanupInterval time.Duration
	ctx             context.Context
	cancel          context.CancelFunc
	stopOnce        sync.Once
}

// New creates a new cache instance
func New(cfg Config) *Cache {
	ctx, cancel := context.WithCancel(context.Background())

	c := &Cache{
		items:           make(map[string]*types.CacheItem),
		maxSize:         cfg.MaxSize,
		ttl:             cfg.TTL,
		cleanupInterval: cfg.CleanupInterval,
		ctx:             ctx,
		cancel:          cancel,
	}

	// Start cleanup goroutine
	go c.cleanupLoop()

	return c

}

// Set stores an observation for the given asset pair with a timestamp
func (c *Cache) Set(pair types.AssetPair, obs *types.Observation, timestamp time.Time) {
	c.mu.Lock()
	defer c.mu.Unlock()

	key := helpers.CalculateCacheKey(pair)
	c.items[key] = &types.CacheItem{
		Observation: obs,
		Timestamp:   timestamp,
	}
}

// Get retrieves an observation for the given asset pair
func (c *Cache) Get(pair types.AssetPair) *types.Observation {
	c.mu.RLock()
	defer c.mu.RUnlock()

	key := helpers.CalculateCacheKey(pair)
	if item, exists := c.items[key]; exists {
		return item.Observation
	}
	return nil
}

// Keys returns all keys in the cache
func (c *Cache) Keys() []string {
	c.mu.RLock()
	defer c.mu.RUnlock()

	keys := make([]string, 0, len(c.items))
	for key := range c.items {
		keys = append(keys, key)
	}
	return keys
}

// Size returns the number of items in the cache
func (c *Cache) Size() int {
	c.mu.RLock()
	defer c.mu.RUnlock()

	return len(c.items)
}

// cleanupLoop periodically removes expired items
func (c *Cache) cleanupLoop() {
	ticker := time.NewTicker(c.cleanupInterval)
	defer ticker.Stop()

	for {
		select {
		case <-c.ctx.Done():
			return
		case <-ticker.C:
			c.cleanupExpired()
		}
	}
}

// cleanupExpired removes expired items from the cache
func (c *Cache) cleanupExpired() {
	c.mu.Lock()
	defer c.mu.Unlock()

	now := time.Now()
	for key, item := range c.items {
		if now.Sub(item.Timestamp) > c.ttl {
			delete(c.items, key)
		}
	}
}

// Stop stops the cache cleanup goroutine
func (c *Cache) Stop() {
	c.stopOnce.Do(func() {
		c.cancel()
	})
}
