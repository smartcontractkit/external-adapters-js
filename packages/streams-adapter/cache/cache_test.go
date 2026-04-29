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

// mustKey computes the internal cache key for the given params, failing the test on error.
func mustKey(t *testing.T, params types.RequestParams) string {
	t.Helper()
	key, err := helpers.CalculateCacheKey(params)
	require.NoError(t, err)
	return key
}

// setActive is a test helper that drives a raw key through the full lifecycle
// (new → learned → active) with the given observation.
// When there is no parameter transformation rawKey == transformedKey.
func setActive(c *Cache, rawKey, transformedKey string, obs *types.Observation, timestamp time.Time, originalAdapterKey string) {
	c.SetNew(rawKey)
	c.SetTransformedKey(rawKey, transformedKey)
	c.SetObservation(transformedKey, obs, timestamp, originalAdapterKey)
}

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
			require.NotNil(t, c.byTransformedKey)
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
		CleanupInterval: time.Hour,
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
			rawKey := mustKey(t, tt.params)
			timestamp := time.Now()
			setActive(c, rawKey, rawKey, tt.observation, timestamp, tt.originalAdapterKey)

			got := c.Get(rawKey)
			if tt.shouldFind {
				require.NotNil(t, got)
				require.Equal(t, types.StatusActive, got.Status)
				require.Equal(t, tt.observation.Success, got.Observation.Success)
				require.Equal(t, tt.observation.Error, got.Observation.Error)
				require.Equal(t, string(tt.observation.Data), string(got.Observation.Data))
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

	key := mustKey(t, types.RequestParams{"endpoint": "crypto", "base": "BTC"})
	setActive(c, key, key, &types.Observation{Success: true}, time.Now(), "adapter")

	got := c.Get(mustKey(t, types.RequestParams{"endpoint": "nonexistent", "base": "XYZ"}))
	assert.Nil(t, got)
}

func TestCache_SetNew_Idempotent(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	created := c.SetNew("some-key")
	require.True(t, created, "first SetNew should create the item")

	created = c.SetNew("some-key")
	require.False(t, created, "second SetNew should be a no-op")

	require.Len(t, c.Items(), 1)
}

func TestCache_SetNew_StatusNew(t *testing.T) {
	c := New(Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()

	c.SetNew("raw-key")
	item := c.Get("raw-key")
	require.NotNil(t, item)
	require.Equal(t, types.StatusNew, item.Status)
	require.Nil(t, item.Observation)
	require.Empty(t, item.TransformedKey)
}

func TestCache_SetTransformedKey_StatusLearned(t *testing.T) {
	c := New(Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()

	c.SetNew("raw-key")
	c.SetTransformedKey("raw-key", "transformed-key")

	item := c.Get("raw-key")
	require.NotNil(t, item)
	require.Equal(t, types.StatusLearned, item.Status)
	require.Equal(t, "transformed-key", item.TransformedKey)
	require.Nil(t, item.Observation)
}

func TestCache_SetObservation_StatusActive(t *testing.T) {
	c := New(Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()

	obs := &types.Observation{Success: true, Data: json.RawMessage(`{"result":42}`)}
	c.SetNew("raw-key")
	c.SetTransformedKey("raw-key", "transformed-key")
	c.SetObservation("transformed-key", obs, time.Now(), "adapter-key")

	item := c.Get("raw-key")
	require.NotNil(t, item)
	require.Equal(t, types.StatusActive, item.Status)
	require.Equal(t, obs, item.Observation)
	require.Equal(t, "adapter-key", item.OriginalAdapterKey)
}

func TestCache_Set_Overwrite(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	rawKey := mustKey(t, types.RequestParams{"endpoint": "crypto", "base": "BTC"})
	obs1 := &types.Observation{Data: json.RawMessage(`{"result": 50000}`), Success: true}
	obs2 := &types.Observation{Data: json.RawMessage(`{"result": 60000}`), Success: true}

	setActive(c, rawKey, rawKey, obs1, time.Now(), "adapter-key-1")
	setActive(c, rawKey, rawKey, obs2, time.Now(), "adapter-key-2")

	got := c.Get(rawKey)
	require.NotNil(t, got)
	require.Equal(t, string(obs2.Data), string(got.Observation.Data))
	require.Len(t, c.Items(), 1)
}

func TestCache_Items(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	require.Len(t, c.Items(), 0)

	params1 := types.RequestParams{"endpoint": "a"}
	obs1 := &types.Observation{Data: json.RawMessage(`{"id": 1}`), Success: true}
	ts1 := time.Now()
	key1 := mustKey(t, params1)

	setActive(c, key1, key1, obs1, ts1, "adapter-1")

	key2 := mustKey(t, types.RequestParams{"endpoint": "b"})
	setActive(c, key2, key2, &types.Observation{Data: json.RawMessage(`{"id": 2}`), Success: true}, time.Now().Add(time.Second), "adapter-2")

	items := c.Items()
	require.Len(t, items, 2)

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
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	obs := &types.Observation{Success: true}

	// Set item with old timestamp (bypassing the lifecycle for simplicity).
	oldRawKey := mustKey(t, types.RequestParams{"endpoint": "old"})
	c.SetNew(oldRawKey)
	c.SetTransformedKey(oldRawKey, "old-transformed")
	c.SetObservation("old-transformed", obs, time.Now().Add(-ttl*2), "old-adapter")
	// Force the item's own timestamp back too.
	c.mu.Lock()
	c.items[oldRawKey].Timestamp = time.Now().Add(-ttl * 2)
	c.mu.Unlock()

	newRawKey := mustKey(t, types.RequestParams{"endpoint": "new"})
	setActive(c, newRawKey, newRawKey, obs, time.Now(), "new-adapter")

	require.Len(t, c.Items(), 2)
	c.cleanupExpired()
	require.Len(t, c.Items(), 1)

	// byTransformedKey entry for the expired item must be gone.
	c.mu.RLock()
	_, oldEntryExists := c.byTransformedKey["old-transformed"]
	c.mu.RUnlock()
	assert.False(t, oldEntryExists, "expired item's transformedKey entry should be removed")

	got := c.Get(oldRawKey)
	assert.Nil(t, got)

	got = c.Get(newRawKey)
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

	oldRawKey := mustKey(t, types.RequestParams{"endpoint": "old"})
	c.SetNew(oldRawKey)
	c.SetTransformedKey(oldRawKey, oldRawKey)
	c.SetObservation(oldRawKey, obs, time.Now().Add(-ttl*2), "old-adapter")
	c.mu.Lock()
	c.items[oldRawKey].Timestamp = time.Now().Add(-ttl * 2)
	c.mu.Unlock()

	require.Len(t, c.Items(), 1)

	time.Sleep(cleanupInterval + 20*time.Millisecond)

	require.Len(t, c.Items(), 0)
}

func TestCache_Stop(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Millisecond,
	})

	c.Stop()
	c.Stop()
	c.Stop()

	select {
	case <-c.ctx.Done():
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

	rawKey := mustKey(t, types.RequestParams{"endpoint": "CRYPTO", "base": "BTC"})
	setActive(c, rawKey, rawKey, obs, time.Now(), "adapter")

	// mustKey normalises, so both lookups resolve to the same key.
	got := c.Get(mustKey(t, types.RequestParams{"endpoint": "crypto", "base": "btc"}))
	require.NotNil(t, got)

	got = c.Get(mustKey(t, types.RequestParams{"endpoint": "Crypto", "base": "Btc"}))
	require.NotNil(t, got)
}

func TestCache_DeterministicKeyOrdering(t *testing.T) {
	c := New(Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour,
	})
	defer c.Stop()

	obs := &types.Observation{Success: true}

	params1 := types.RequestParams{
		"z-param":  "z",
		"a-param":  "a",
		"m-param":  "m",
		"endpoint": "test",
	}
	rawKey := mustKey(t, params1)
	setActive(c, rawKey, rawKey, obs, time.Now(), "adapter")

	params2 := types.RequestParams{
		"endpoint": "test",
		"m-param":  "m",
		"a-param":  "a",
		"z-param":  "z",
	}
	got := c.Get(mustKey(t, params2))
	require.NotNil(t, got)

	require.Len(t, c.Items(), 1)
}
