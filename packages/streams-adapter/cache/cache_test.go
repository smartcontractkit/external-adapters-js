package cache

import (
	"sync"
	"testing"
	"time"

	types "streams-adapter/common"

	"github.com/goccy/go-json"
)

func TestNew(t *testing.T) {
	tests := []struct {
		name   string
		config Config
	}{
		{
			name: "default config",
			config: Config{
				TTL:             time.Minute,
				CleanupInterval: time.Second * 30,
			},
		},
		{
			name: "zero config",
			config: Config{
				TTL:             0,
				CleanupInterval: time.Millisecond,
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := New(tt.config)
			defer c.Stop()

			if c == nil {
				t.Fatal("New() returned nil")
			}
			if c.items == nil {
				t.Error("items map is nil")
			}
			if c.ttl != tt.config.TTL {
				t.Errorf("ttl = %v, want %v", c.ttl, tt.config.TTL)
			}
			if c.cleanupInterval != tt.config.CleanupInterval {
				t.Errorf("cleanupInterval = %v, want %v", c.cleanupInterval, tt.config.CleanupInterval)
			}
			if c.ctx == nil {
				t.Error("context is nil")
			}
			if c.cancel == nil {
				t.Error("cancel func is nil")
			}
		})
	}
}

func TestCache_SetAndGet(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour, // Long interval to avoid interference
	})
	defer c.Stop()

	tests := []struct {
		name               string
		params             types.RequestParams
		observation        *types.Observation
		originalAdapterKey string
		shouldFind         bool
	}{
		{
			name: "set and get",
			params: types.RequestParams{
				"endpoint": "crypto",
				"base":     "BTC",
				"quote":    "USD",
			},
			observation: &types.Observation{
				Data:    json.RawMessage(`{"result": 50000}`),
				Success: true,
			},
			originalAdapterKey: "adapter-key-1",
			shouldFind:         true,
		},
		{
			name: "observation with error",
			params: types.RequestParams{
				"endpoint": "error-test",
			},
			observation: &types.Observation{
				Data:    nil,
				Success: false,
				Error:   "API error",
			},
			originalAdapterKey: "adapter-key-4",
			shouldFind:         true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			timestamp := time.Now()
			c.Set(tt.params, tt.observation, timestamp, tt.originalAdapterKey)

			got := c.Get(tt.params)
			if tt.shouldFind {
				if got == nil {
					t.Error("Get() returned nil, expected observation")
					return
				}
				if got.Success != tt.observation.Success {
					t.Errorf("Success = %v, want %v", got.Success, tt.observation.Success)
				}
				if got.Error != tt.observation.Error {
					t.Errorf("Error = %v, want %v", got.Error, tt.observation.Error)
				}
				if string(got.Data) != string(tt.observation.Data) {
					t.Errorf("Data = %s, want %s", got.Data, tt.observation.Data)
				}
			} else {
				if got != nil {
					t.Errorf("Get() = %v, want nil", got)
				}
			}
		})
	}
}

func TestCache_Get_NotFound(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	// Set a value first
	c.Set(types.RequestParams{"endpoint": "crypto", "base": "BTC"}, &types.Observation{Success: true}, time.Now(), "adapter")

	// Try to get a different key
	params := types.RequestParams{
		"endpoint": "nonexistent",
		"base":     "XYZ",
	}

	got := c.Get(params)
	if got != nil {
		t.Errorf("Get() for nonexistent key = %v, want nil", got)
	}
}

func TestCache_Get_EmptyParams(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	params := types.RequestParams{}

	got := c.Get(params)
	if got != nil {
		t.Errorf("Get() for empty params = %v, want nil", got)
	}
}

func TestCache_Set_EmptyParams(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	params := types.RequestParams{}
	obs := &types.Observation{
		Data:    json.RawMessage(`{"test": true}`),
		Success: true,
	}

	// Should not panic and should not store anything
	c.Set(params, obs, time.Now(), "adapter-key")

	// Verify nothing was stored
	if c.Size() != 0 {
		t.Errorf("Size() = %d, want 0 after setting empty params", c.Size())
	}
}

func TestCache_Set_Overwrite(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	params := types.RequestParams{
		"endpoint": "crypto",
		"base":     "BTC",
	}

	obs1 := &types.Observation{
		Data:    json.RawMessage(`{"result": 50000}`),
		Success: true,
	}

	obs2 := &types.Observation{
		Data:    json.RawMessage(`{"result": 60000}`),
		Success: true,
	}

	c.Set(params, obs1, time.Now(), "adapter-key-1")
	c.Set(params, obs2, time.Now(), "adapter-key-2")

	got := c.Get(params)
	if got == nil {
		t.Fatal("Get() returned nil")
	}
	if string(got.Data) != string(obs2.Data) {
		t.Errorf("Data = %s, want %s (should be overwritten)", got.Data, obs2.Data)
	}

	// Size should still be 1
	if c.Size() != 1 {
		t.Errorf("Size() = %d, want 1", c.Size())
	}
}

func TestCache_Keys(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	// Empty cache
	keys := c.Keys()
	if len(keys) != 0 {
		t.Errorf("Keys() on empty cache = %v, want empty slice", keys)
	}

	// Add items
	obs := &types.Observation{Success: true}
	c.Set(types.RequestParams{"endpoint": "a"}, obs, time.Now(), "key1")
	c.Set(types.RequestParams{"endpoint": "b"}, obs, time.Now(), "key2")
	c.Set(types.RequestParams{"endpoint": "c"}, obs, time.Now(), "key3")

	keys = c.Keys()
	if len(keys) != 3 {
		t.Errorf("Keys() length = %d, want 3", len(keys))
	}
}

func TestCache_Size(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	if c.Size() != 0 {
		t.Errorf("Size() on empty cache = %d, want 0", c.Size())
	}

	obs := &types.Observation{Success: true}

	c.Set(types.RequestParams{"endpoint": "a"}, obs, time.Now(), "key1")
	if c.Size() != 1 {
		t.Errorf("Size() after 1 insert = %d, want 1", c.Size())
	}

	c.Set(types.RequestParams{"endpoint": "b"}, obs, time.Now(), "key2")
	if c.Size() != 2 {
		t.Errorf("Size() after 2 inserts = %d, want 2", c.Size())
	}

	// Overwrite existing key
	c.Set(types.RequestParams{"endpoint": "a"}, obs, time.Now(), "key1-updated")
	if c.Size() != 2 {
		t.Errorf("Size() after overwrite = %d, want 2", c.Size())
	}
}

func TestCache_Items(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	// Empty cache
	items := c.Items()
	if len(items) != 0 {
		t.Errorf("Items() on empty cache = %d items, want 0", len(items))
	}

	// Add items
	obs1 := &types.Observation{Data: json.RawMessage(`{"id": 1}`), Success: true}
	obs2 := &types.Observation{Data: json.RawMessage(`{"id": 2}`), Success: true}

	ts1 := time.Now()
	ts2 := time.Now().Add(time.Second)

	c.Set(types.RequestParams{"endpoint": "a"}, obs1, ts1, "adapter-1")
	c.Set(types.RequestParams{"endpoint": "b"}, obs2, ts2, "adapter-2")

	items = c.Items()
	if len(items) != 2 {
		t.Errorf("Items() length = %d, want 2", len(items))
	}

	// Verify items contain expected data
	for _, item := range items {
		if item.Observation == nil {
			t.Error("Item has nil Observation")
		}
		if item.OriginalAdapterKey == "" {
			t.Error("Item has empty OriginalAdapterKey")
		}
	}
}

func TestCache_Items_ReturnsCopy(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	obs := &types.Observation{Success: true}
	c.Set(types.RequestParams{"endpoint": "a"}, obs, time.Now(), "adapter-1")

	items := c.Items()
	originalLen := len(items)

	// Modify the returned map
	items["modified-key"] = &types.CacheItem{}

	// Original cache should be unchanged
	if c.Size() != originalLen {
		t.Errorf("Cache size changed after modifying Items() result: got %d, want %d", c.Size(), originalLen)
	}
}

func TestCache_CleanupExpired(t *testing.T) {
	ttl := 50 * time.Millisecond
	c := New(Config{
		TTL:             ttl,
		CleanupInterval: time.Hour, // Manual cleanup
	})
	defer c.Stop()

	obs := &types.Observation{Success: true}

	// Set item with old timestamp
	oldTime := time.Now().Add(-ttl * 2)
	c.Set(types.RequestParams{"endpoint": "old"}, obs, oldTime, "old-adapter")

	// Set item with current timestamp
	c.Set(types.RequestParams{"endpoint": "new"}, obs, time.Now(), "new-adapter")

	if c.Size() != 2 {
		t.Fatalf("Size() before cleanup = %d, want 2", c.Size())
	}

	// Run cleanup
	c.cleanupExpired()

	if c.Size() != 1 {
		t.Errorf("Size() after cleanup = %d, want 1", c.Size())
	}

	// Verify the old item was removed
	got := c.Get(types.RequestParams{"endpoint": "old"})
	if got != nil {
		t.Error("Old item should have been cleaned up")
	}

	// Verify the new item still exists
	got = c.Get(types.RequestParams{"endpoint": "new"})
	if got == nil {
		t.Error("New item should still exist")
	}
}

func TestCache_CleanupLoop(t *testing.T) {
	ttl := 20 * time.Millisecond
	cleanupInterval := 30 * time.Millisecond

	c := New(Config{
		TTL:             ttl,
		CleanupInterval: cleanupInterval,
	})
	defer c.Stop()

	obs := &types.Observation{Success: true}

	// Set item with old timestamp (should be expired)
	oldTime := time.Now().Add(-ttl * 2)
	c.Set(types.RequestParams{"endpoint": "old"}, obs, oldTime, "old-adapter")

	if c.Size() != 1 {
		t.Fatalf("Size() before cleanup = %d, want 1", c.Size())
	}

	// Wait for automatic cleanup to run
	time.Sleep(cleanupInterval + 20*time.Millisecond)

	if c.Size() != 0 {
		t.Errorf("Size() after automatic cleanup = %d, want 0", c.Size())
	}
}

func TestCache_Stop(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Millisecond,
	})

	// Stop should not panic
	c.Stop()

	// Multiple Stop calls should not panic (sync.Once)
	c.Stop()
	c.Stop()

	// Verify context is cancelled
	select {
	case <-c.ctx.Done():
		// Expected
	default:
		t.Error("Context should be cancelled after Stop()")
	}
}

func TestCache_ConcurrentAccess(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	var wg sync.WaitGroup
	numGoroutines := 100
	numOperations := 100

	// Concurrent writes
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < numOperations; j++ {
				params := types.RequestParams{
					"endpoint": "test",
					"id":       string(rune(id)),
					"op":       string(rune(j)),
				}
				obs := &types.Observation{
					Data:    json.RawMessage(`{"id": "test"}`),
					Success: true,
				}
				c.Set(params, obs, time.Now(), "adapter")
			}
		}(i)
	}

	// Concurrent reads
	for i := 0; i < numGoroutines; i++ {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			for j := 0; j < numOperations; j++ {
				params := types.RequestParams{
					"endpoint": "test",
					"id":       string(rune(id)),
					"op":       string(rune(j)),
				}
				_ = c.Get(params)
			}
		}(i)
	}

	// Concurrent Size/Keys/Items calls
	for i := 0; i < numGoroutines/10; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			for j := 0; j < numOperations; j++ {
				_ = c.Size()
				_ = c.Keys()
				_ = c.Items()
			}
		}()
	}

	wg.Wait()
}

func TestCache_ConcurrentSetAndCleanup(t *testing.T) {
	ttl := 10 * time.Millisecond
	c := New(Config{
		TTL:             ttl,
		CleanupInterval: 5 * time.Millisecond,
	})
	defer c.Stop()

	var wg sync.WaitGroup

	// Continuously set items
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 200; i++ {
			params := types.RequestParams{
				"endpoint": "test",
				"i":        string(rune(i)),
			}
			obs := &types.Observation{Success: true}
			// Alternate between old and new timestamps
			ts := time.Now()
			if i%2 == 0 {
				ts = time.Now().Add(-ttl * 2)
			}
			c.Set(params, obs, ts, "adapter")
			time.Sleep(time.Millisecond)
		}
	}()

	// Continuously read items
	wg.Add(1)
	go func() {
		defer wg.Done()
		for i := 0; i < 200; i++ {
			params := types.RequestParams{
				"endpoint": "test",
				"i":        string(rune(i)),
			}
			_ = c.Get(params)
			time.Sleep(time.Millisecond)
		}
	}()

	wg.Wait()
}

func TestCache_CaseInsensitiveKeys(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	obs := &types.Observation{
		Data:    json.RawMessage(`{"result": 100}`),
		Success: true,
	}

	// Set with uppercase
	c.Set(types.RequestParams{"endpoint": "CRYPTO", "base": "BTC"}, obs, time.Now(), "adapter")

	// Get with lowercase (should find due to key normalization)
	got := c.Get(types.RequestParams{"endpoint": "crypto", "base": "btc"})
	if got == nil {
		t.Error("Expected to find item with case-insensitive lookup")
	}

	// Get with mixed case
	got = c.Get(types.RequestParams{"endpoint": "Crypto", "base": "Btc"})
	if got == nil {
		t.Error("Expected to find item with mixed case lookup")
	}
}

func TestCache_DeterministicKeyOrdering(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	obs := &types.Observation{Success: true}

	// Set with params in one order
	params1 := types.RequestParams{
		"z-param":  "z",
		"a-param":  "a",
		"m-param":  "m",
		"endpoint": "test",
	}
	c.Set(params1, obs, time.Now(), "adapter")

	// Get with params in different order (should find same item)
	params2 := types.RequestParams{
		"endpoint": "test",
		"m-param":  "m",
		"a-param":  "a",
		"z-param":  "z",
	}
	got := c.Get(params2)
	if got == nil {
		t.Error("Expected to find item regardless of param order")
	}

	// Size should still be 1
	if c.Size() != 1 {
		t.Errorf("Size() = %d, want 1 (params order should not matter)", c.Size())
	}
}

func TestCache_ImplementsInterface(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	// Verify Cache implements types.Cache interface
	var _ types.Cache = c
}

func BenchmarkCache_Set(b *testing.B) {
	c := New(Config{
		TTL:             time.Hour,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	obs := &types.Observation{
		Data:    json.RawMessage(`{"result": 50000}`),
		Success: true,
	}
	ts := time.Now()

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		params := types.RequestParams{
			"endpoint": "crypto",
			"base":     "BTC",
			"quote":    "USD",
			"i":        string(rune(i % 10000)),
		}
		c.Set(params, obs, ts, "adapter")
	}
}

func BenchmarkCache_Get(b *testing.B) {
	c := New(Config{
		TTL:             time.Hour,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	obs := &types.Observation{
		Data:    json.RawMessage(`{"result": 50000}`),
		Success: true,
	}

	// Pre-populate cache
	for i := 0; i < 10000; i++ {
		params := types.RequestParams{
			"endpoint": "crypto",
			"base":     "BTC",
			"quote":    "USD",
			"i":        string(rune(i)),
		}
		c.Set(params, obs, time.Now(), "adapter")
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		params := types.RequestParams{
			"endpoint": "crypto",
			"base":     "BTC",
			"quote":    "USD",
			"i":        string(rune(i % 10000)),
		}
		_ = c.Get(params)
	}
}

func BenchmarkCache_ConcurrentSetGet(b *testing.B) {
	c := New(Config{
		TTL:             time.Hour,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	obs := &types.Observation{
		Data:    json.RawMessage(`{"result": 50000}`),
		Success: true,
	}
	ts := time.Now()

	b.ResetTimer()
	b.RunParallel(func(pb *testing.PB) {
		i := 0
		for pb.Next() {
			params := types.RequestParams{
				"endpoint": "crypto",
				"base":     "BTC",
				"i":        string(rune(i % 1000)),
			}
			if i%2 == 0 {
				c.Set(params, obs, ts, "adapter")
			} else {
				_ = c.Get(params)
			}
			i++
		}
	})
}
