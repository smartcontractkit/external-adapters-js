package helpers

import (
	"log/slog"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/require"
)

func TestKeyMapper_GetEmpty(t *testing.T) {
	km := NewKeyMapper(slog.Default())
	_, ok := km.Get("nonexistent")
	require.False(t, ok)
}

func TestKeyMapper_NotifyAndLearn(t *testing.T) {
	initTestAdapter(t)
	km := NewKeyMapper(slog.Default())

	// SubscribeAndLearn uses canonical endpoint as the pending key.
	canonicalEndpoint := "price"
	rawCacheKey := "base=link:endpoint=price:quote=usd"

	// Simulate JS ZADD with a realistic subscription set key.
	// Format: <ADAPTER>-<endpoint>-<transport>-subscriptionSet
	zaddKey := "TEST-ADAPTER-price-default_single_transport-subscriptionSet"

	var wg sync.WaitGroup
	wg.Add(1)
	go func() {
		defer wg.Done()
		km.SubscribeAndLearn(canonicalEndpoint, rawCacheKey, func() {
			km.NotifyZAdd(zaddKey, `{"base":"LINK","quote":"USD"}`)
		})
	}()

	wg.Wait()

	transformedKey, ok := km.Get(rawCacheKey)
	require.True(t, ok, "mapping should be learned after subscription")
	require.NotEmpty(t, transformedKey)
}

func TestKeyMapper_NotifyZAdd_NoSubscriptionSetSuffix(t *testing.T) {
	km := NewKeyMapper(slog.Default())

	km.NotifyZAdd("some-other-key", `{"base":"ETH"}`)
	require.Equal(t, 0, km.Size())
}

func TestKeyMapper_SubscribeAndLearn_Timeout(t *testing.T) {
	initTestAdapter(t)
	km := NewKeyMapper(slog.Default())

	canonicalEndpoint := "price"
	rawCacheKey := "base=timeout:endpoint=price"

	start := time.Now()
	km.SubscribeAndLearn(canonicalEndpoint, rawCacheKey, func() {
		// Don't send ZADD — simulate failure
	})
	elapsed := time.Since(start)

	_, ok := km.Get(rawCacheKey)
	require.False(t, ok, "mapping should NOT be learned when ZADD times out")
	require.GreaterOrEqual(t, elapsed, 2*time.Second, "should have waited for timeout")
}

func TestKeyMapper_SubscribeAndLearn_AlreadyMapped(t *testing.T) {
	initTestAdapter(t)
	km := NewKeyMapper(slog.Default())

	canonicalEndpoint := "price"
	rawCacheKey := "base=eth:endpoint=price:quote=usd"

	km.mu.Lock()
	km.mapping[rawCacheKey] = "already-mapped"
	km.mu.Unlock()

	subscribeCalled := false
	km.SubscribeAndLearn(canonicalEndpoint, rawCacheKey, func() {
		subscribeCalled = true
	})

	require.True(t, subscribeCalled)

	got, ok := km.Get(rawCacheKey)
	require.True(t, ok)
	require.Equal(t, "already-mapped", got)
}

func TestKeyMapper_SerializedPerEndpoint(t *testing.T) {
	initTestAdapter(t)
	km := NewKeyMapper(slog.Default())

	canonicalEndpoint := "price"
	zaddKey := "TEST-ADAPTER-price-ws-subscriptionSet"

	var order []int
	var mu sync.Mutex

	var wg sync.WaitGroup
	for i := 0; i < 3; i++ {
		wg.Add(1)
		i := i
		go func() {
			defer wg.Done()
			rawKey := "test-serial-" + string(rune('a'+i))
			km.SubscribeAndLearn(canonicalEndpoint, rawKey, func() {
				mu.Lock()
				order = append(order, i)
				mu.Unlock()
				km.NotifyZAdd(zaddKey, `{"base":"X","quote":"Y"}`)
			})
		}()
		time.Sleep(10 * time.Millisecond)
	}

	wg.Wait()

	mu.Lock()
	require.Len(t, order, 3, "all 3 subscriptions should complete")
	mu.Unlock()
}

func TestKeyMapper_Size(t *testing.T) {
	km := NewKeyMapper(slog.Default())
	require.Equal(t, 0, km.Size())

	km.mu.Lock()
	km.mapping["a"] = "b"
	km.mapping["c"] = "d"
	km.mu.Unlock()

	require.Equal(t, 2, km.Size())
}
