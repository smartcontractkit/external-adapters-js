package cache

import (
	"testing"
	"time"

	types "streams-adapter/common"
	helpers "streams-adapter/helpers"

	"github.com/goccy/go-json"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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

			require.NotNil(t, c)
			require.NotNil(t, c.items)
			require.Equal(t, tt.config.TTL, c.ttl)
			require.Equal(t, tt.config.CleanupInterval, c.cleanupInterval)
			require.NotNil(t, c.ctx)
			require.NotNil(t, c.cancel)
		})
	}
}

func TestNew_DefaultCleanupIntervalWhenNonPositive(t *testing.T) {
	tests := []struct {
		name            string
		cleanupInterval time.Duration
	}{
		{
			name:            "zero cleanup interval",
			cleanupInterval: 0,
		},
		{
			name:            "negative cleanup interval",
			cleanupInterval: -1 * time.Second,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := New(Config{
				TTL:             time.Minute,
				CleanupInterval: tt.cleanupInterval,
			})
			defer c.Stop()

			require.Equal(t, time.Minute, c.cleanupInterval)
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
				require.NotNil(t, got)
				require.Equal(t, tt.observation.Success, got.Success)
				require.Equal(t, tt.observation.Error, got.Error)
				require.Equal(t, string(tt.observation.Data), string(got.Data))
			} else {
				assert.Nil(t, got)
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
	assert.Nil(t, got)
}

func TestCache_Get_EmptyParams(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	params := types.RequestParams{}

	got := c.Get(params)
	assert.Nil(t, got)
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
	require.Equal(t, 0, c.Size())
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
	require.NotNil(t, got)
	require.Equal(t, string(obs2.Data), string(got.Data))

	// Size should still be 1
	require.Equal(t, 1, c.Size())
}

func TestCache_Keys(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	// Empty cache
	keys := c.Keys()
	require.Len(t, keys, 0)

	// Add items
	obs := &types.Observation{Success: true}
	c.Set(types.RequestParams{"endpoint": "a"}, obs, time.Now(), "key1")
	c.Set(types.RequestParams{"endpoint": "b"}, obs, time.Now(), "key2")
	c.Set(types.RequestParams{"endpoint": "c"}, obs, time.Now(), "key3")

	keys = c.Keys()
	require.Len(t, keys, 3)
}

func TestCache_Size(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	require.Equal(t, 0, c.Size())

	obs := &types.Observation{Success: true}

	c.Set(types.RequestParams{"endpoint": "a"}, obs, time.Now(), "key1")
	require.Equal(t, 1, c.Size())

	c.Set(types.RequestParams{"endpoint": "b"}, obs, time.Now(), "key2")
	require.Equal(t, 2, c.Size())

	// Overwrite existing key
	c.Set(types.RequestParams{"endpoint": "a"}, obs, time.Now(), "key1-updated")
	require.Equal(t, 2, c.Size())
}

func TestCache_Items(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	// Empty cache
	items := c.Items()
	require.Len(t, items, 0)

	// Add items
	params1 := types.RequestParams{"endpoint": "a"}
	obs1 := &types.Observation{Data: json.RawMessage(`{"id": 1}`), Success: true}

	ts1 := time.Now()

	c.Set(params1, obs1, ts1, "adapter-1")
	c.Set(types.RequestParams{"endpoint": "b"}, &types.Observation{Data: json.RawMessage(`{"id": 2}`), Success: true}, time.Now().Add(time.Second), "adapter-2")

	items = c.Items()
	require.Len(t, items, 2)

	// Verify one inserted item by its deterministic cache key.
	key1, err := helpers.CalculateCacheKey(params1)
	require.NoError(t, err)
	item1, ok := items[key1]
	require.True(t, ok)
	require.NotNil(t, item1)
	require.Equal(t, obs1, item1.Observation)
	require.Equal(t, ts1, item1.Timestamp)
	require.Equal(t, "adapter-1", item1.OriginalAdapterKey)
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

	require.Equal(t, 2, c.Size())

	// Run cleanup
	c.cleanupExpired()

	require.Equal(t, 1, c.Size())

	// Verify the old item was removed
	got := c.Get(types.RequestParams{"endpoint": "old"})
	assert.Nil(t, got)

	// Verify the new item still exists
	got = c.Get(types.RequestParams{"endpoint": "new"})
	require.NotNil(t, got)
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

	require.Equal(t, 1, c.Size())

	// Wait for automatic cleanup to run
	time.Sleep(cleanupInterval + 20*time.Millisecond)

	require.Equal(t, 0, c.Size())
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
	require.NotNil(t, got)

	// Get with mixed case
	got = c.Get(types.RequestParams{"endpoint": "Crypto", "base": "Btc"})
	require.NotNil(t, got)
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
	require.NotNil(t, got)

	// Size should still be 1
	require.Equal(t, 1, c.Size())
}
