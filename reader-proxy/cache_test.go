package main

import (
	"testing"
	"time"
)

func TestCache_SetAndGet(t *testing.T) {
	cache := NewCache(1*time.Second, 2*time.Second)
	defer cache.Stop()

	key := "test-key"
	value := []byte("test-value")
	statusCode := 200
	headers := map[string]string{"Content-Type": "application/json"}

	// Set a value
	cache.Set(key, value, statusCode, headers)

	// Get the value
	entry, found := cache.Get(key)
	if !found {
		t.Fatal("Expected to find cached entry")
	}

	if string(entry.Value) != string(value) {
		t.Errorf("Expected value %s, got %s", value, entry.Value)
	}

	if entry.StatusCode != statusCode {
		t.Errorf("Expected status code %d, got %d", statusCode, entry.StatusCode)
	}
}

func TestCache_Expiration(t *testing.T) {
	cache := NewCache(100*time.Millisecond, 50*time.Millisecond)
	defer cache.Stop()

	key := "expiring-key"
	value := []byte("expiring-value")

	cache.Set(key, value, 200, nil)

	// Should be found immediately
	_, found := cache.Get(key)
	if !found {
		t.Fatal("Expected to find cached entry immediately")
	}

	// Wait for expiration
	time.Sleep(150 * time.Millisecond)

	// Should not be found after expiration
	_, found = cache.Get(key)
	if found {
		t.Fatal("Expected cache entry to be expired")
	}
}

func TestCache_Cleanup(t *testing.T) {
	cache := NewCache(50*time.Millisecond, 100*time.Millisecond)
	defer cache.Stop()

	// Add multiple entries
	for i := 0; i < 5; i++ {
		key := string(rune('a' + i))
		cache.Set(key, []byte("value"), 200, nil)
	}

	if cache.Size() != 5 {
		t.Errorf("Expected cache size 5, got %d", cache.Size())
	}

	// Wait for expiration and cleanup
	time.Sleep(200 * time.Millisecond)

	// Cache should be cleaned up
	if cache.Size() != 0 {
		t.Errorf("Expected cache size 0 after cleanup, got %d", cache.Size())
	}
}

func TestCache_Metrics(t *testing.T) {
	cache := NewCache(1*time.Second, 2*time.Second)
	defer cache.Stop()

	key := "metrics-key"
	value := []byte("metrics-value")

	// Initial metrics
	hits, misses, size := cache.GetMetrics()
	if hits != 0 || misses != 0 || size != 0 {
		t.Errorf("Expected initial metrics to be 0, got hits=%d, misses=%d, size=%d", hits, misses, size)
	}

	// Cache miss
	cache.Get(key)
	hits, misses, size = cache.GetMetrics()
	if misses != 1 {
		t.Errorf("Expected 1 miss, got %d", misses)
	}

	// Set value
	cache.Set(key, value, 200, nil)

	// Cache hit
	cache.Get(key)
	hits, misses, size = cache.GetMetrics()
	if hits != 1 {
		t.Errorf("Expected 1 hit, got %d", hits)
	}
	if size != 1 {
		t.Errorf("Expected size 1, got %d", size)
	}
}

func TestCache_ConcurrentAccess(t *testing.T) {
	cache := NewCache(1*time.Second, 2*time.Second)
	defer cache.Stop()

	done := make(chan bool)
	iterations := 100

	// Concurrent writes
	for i := 0; i < 10; i++ {
		go func(id int) {
			for j := 0; j < iterations; j++ {
				key := string(rune('a' + (id % 26)))
				cache.Set(key, []byte("value"), 200, nil)
			}
			done <- true
		}(i)
	}

	// Concurrent reads
	for i := 0; i < 10; i++ {
		go func(id int) {
			for j := 0; j < iterations; j++ {
				key := string(rune('a' + (id % 26)))
				cache.Get(key)
			}
			done <- true
		}(i)
	}

	// Wait for all goroutines
	for i := 0; i < 20; i++ {
		<-done
	}

	// Should not panic and should have some entries
	if cache.Size() < 1 {
		t.Errorf("Expected cache to have entries after concurrent access")
	}
}
