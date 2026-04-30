package cache

import (
	"context"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"

	types "streams-adapter/common"
)

var cacheDataGetCount = promauto.NewCounter(
	prometheus.CounterOpts{
		Name: "cache_data_get_count",
		Help: "The number of cache get operations",
	},
)

var cacheItemsTotal = promauto.NewGauge(
	prometheus.GaugeOpts{
		Name: "cache_items_total",
		Help: "The current number of items in the cache (all statuses)",
	},
)

var cacheItemsActive = promauto.NewGauge(
	prometheus.GaugeOpts{
		Name: "cache_items_active",
		Help: "The current number of active cache items with live observation data",
	},
)

// Config holds cache configuration
type Config struct {
	TTL             time.Duration // Time-to-live for items
	CleanupInterval time.Duration // How often to run cleanup
}

// Cache represents an in-memory cache for observation data
type Cache struct {
	mu               sync.RWMutex
	items            map[string]*types.CacheItem // rawKey → item
	byTransformedKey map[string]string           // transformedKey → rawKey (secondary index)
	ttl              time.Duration
	cleanupInterval  time.Duration
	ctx              context.Context
	cancel           context.CancelFunc
	stopOnce         sync.Once
}

// New creates a new cache instance
func New(cfg Config) *Cache {
	ctx, cancel := context.WithCancel(context.Background())
	cleanupInterval := cfg.CleanupInterval
	if cleanupInterval <= 0 {
		cleanupInterval = time.Minute
	}

	c := &Cache{
		items:            make(map[string]*types.CacheItem),
		byTransformedKey: make(map[string]string),
		ttl:              cfg.TTL,
		cleanupInterval:  cleanupInterval,
		ctx:              ctx,
		cancel:           cancel,
	}

	// Start cleanup goroutine
	go c.cleanupLoop()

	return c

}

// SetNew creates a "new" cache item for the given raw key if one does not
// already exist. Returns true if the item was created (i.e. this is the first
// caller for this key), false if an item already existed.
func (c *Cache) SetNew(rawKey string) bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	if _, exists := c.items[rawKey]; exists {
		return false
	}
	c.items[rawKey] = &types.CacheItem{
		Status:    types.StatusNew,
		Timestamp: time.Now(),
	}
	cacheItemsTotal.Inc()
	return true
}

// SetTransformedKey transitions a "new" item to "learned" by recording the
// raw→transformed key mapping. If a pending observation has already arrived
// for this transformed key, it is applied immediately and the item becomes
// "active". No-op if the raw key is not present in the cache.
func (c *Cache) SetTransformedKey(rawKey, transformedKey string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	item, ok := c.items[rawKey]
	if !ok {
		return
	}
	item.TransformedKey = transformedKey
	item.Status = types.StatusLearned
	item.Timestamp = time.Now()
	c.byTransformedKey[transformedKey] = rawKey
}

// SetObservation transitions the item identified by transformedKey to "active"
// with the given observation. Observations that arrive before the mapping is
// known (before SetTransformedKey is called) are dropped.
func (c *Cache) SetObservation(transformedKey string, obs *types.Observation, timestamp time.Time, originalAdapterKey string) {
	c.mu.Lock()
	defer c.mu.Unlock()

	rawKey, ok := c.byTransformedKey[transformedKey]
	if !ok {
		return
	}

	item, ok := c.items[rawKey]
	if !ok {
		return
	}
	wasActive := item.Status == types.StatusActive
	item.Status = types.StatusActive
	item.Observation = obs
	item.Timestamp = timestamp
	item.OriginalAdapterKey = originalAdapterKey
	if !wasActive {
		cacheItemsActive.Inc()
	}
}

// Get retrieves a cache item by its internal cache key string.
func (c *Cache) Get(key string) *types.CacheItem {
	cacheDataGetCount.Inc()

	c.mu.RLock()
	defer c.mu.RUnlock()

	if item, exists := c.items[key]; exists {
		return item
	}
	return nil
}

// Items returns all items in the cache
func (c *Cache) Items() map[string]*types.CacheItem {
	c.mu.RLock()
	defer c.mu.RUnlock()

	// Create a copy to avoid race conditions
	items := make(map[string]*types.CacheItem, len(c.items))
	for key, item := range c.items {
		items[key] = item
	}
	return items
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

	cutoff := time.Now().Add(-c.ttl)
	for rawKey, item := range c.items {
		if item.Timestamp.Before(cutoff) {
			if item.TransformedKey != "" {
				delete(c.byTransformedKey, item.TransformedKey)
			}
			if item.Status == types.StatusActive {
				cacheItemsActive.Dec()
			}
			cacheItemsTotal.Dec()
			delete(c.items, rawKey)
		}
	}
}

// Stop stops the cache cleanup goroutine
func (c *Cache) Stop() {
	c.stopOnce.Do(func() {
		c.cancel()
	})
}
