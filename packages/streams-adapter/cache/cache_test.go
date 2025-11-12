package cache

import (
	"testing"
	"time"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

func TestCacheSetGetKeysSize(t *testing.T) {
	cfg := Config{TTL: 2 * time.Minute, CleanupInterval: 30 * time.Second}
	c := New(cfg)
	defer c.Stop()

	pair := types.AssetPair{Base: "LINK", Quote: "USD", Endpoint: "cryptolwba"}
	obs := &types.Observation{Data: json.RawMessage(`{
		"mid": 17.889088702834176,
		"bid": 17.88511476884297,
		"ask": 17.89306263682538
	}`), Success: true}
	now := time.Now()

	c.Set(pair, obs, now)

	got := c.Get(pair)
	if got == nil {
		t.Fatalf("expected observation, got nil")
	}
	if got != obs {
		t.Fatalf("expected pointer equality for observation")
	}

	if c.Size() != 1 {
		t.Fatalf("expected size 1, got %d", c.Size())
	}

	keys := c.Keys()
	if len(keys) != 1 {
		t.Fatalf("expected 1 key, got %d", len(keys))
	}
}

func TestCacheExpiration(t *testing.T) {
	ttl := 50 * time.Millisecond
	cfg := Config{TTL: ttl, CleanupInterval: 10 * time.Millisecond}
	c := New(cfg)
	defer c.Stop()

	pair := types.AssetPair{Base: "ETH", Quote: "USD", Endpoint: "price"}
	obs := &types.Observation{Data: json.RawMessage(`{
		"mid": 17.889088702834176,
		"bid": 17.88511476884297,
		"ask": 17.89306263682538
	}`), Success: true}
	c.Set(pair, obs, time.Now())

	time.Sleep(ttl + 50*time.Millisecond)

	if got := c.Get(pair); got != nil {
		t.Fatalf("expected expired item to be removed, got non-nil observation")
	}
	if c.Size() != 0 {
		t.Fatalf("expected size 0 after expiration, got %d", c.Size())
	}
}
