package client

import (
	"testing"
	"time"
)

func TestCacheUsesPayloadHashKey(t *testing.T) {
	cache := NewCache()
	now := time.Now()
	cache.Set("payload-hash", []byte(`{"data":{"result":1}}`), now)

	entry, ok := cache.Get("payload-hash")
	if !ok {
		t.Fatal("expected cache entry")
	}
	if !entry.UpdatedAt.Equal(now) {
		t.Fatalf("unexpected update timestamp %v", entry.UpdatedAt)
	}
}
