package helpers

import (
	"log/slog"
	"strings"
	"sync"
	"time"
)

const zaddNotificationTimeout = 2 * time.Second

// KeyMapper learns and stores mappings from raw cache keys (derived from client
// request params with endpoint-only alias resolution) to transformed cache keys
// (derived from the JS adapter's validated+transformed params seen in ZADD).
//
// The mapping is learned by intercepting the ZADD that the JS adapter sends to
// the subscription sorted set during subscription request processing.
type KeyMapper struct {
	mu      sync.RWMutex
	mapping map[string]string // raw_cache_key → transformed_cache_key

	pendingMu sync.Mutex
	pending   map[string]chan zaddNotification // endpoint_transport key → channel

	epMu   sync.Mutex
	epLocks map[string]*sync.Mutex

	logger *slog.Logger
}

type zaddNotification struct {
	Member           string // JSON member from ZADD (transformed params)
	SubscriptionKey  string // ZADD key minus "-subscriptionSet" suffix
}

// NewKeyMapper creates a new KeyMapper instance.
func NewKeyMapper(logger *slog.Logger) *KeyMapper {
	return &KeyMapper{
		mapping: make(map[string]string),
		pending: make(map[string]chan zaddNotification),
		epLocks: make(map[string]*sync.Mutex),
		logger:  logger,
	}
}

// Get looks up the transformed cache key for a given raw cache key.
// Returns the transformed key and true if found, or empty string and false.
func (km *KeyMapper) Get(rawCacheKey string) (string, bool) {
	km.mu.RLock()
	defer km.mu.RUnlock()
	transformed, ok := km.mapping[rawCacheKey]
	return transformed, ok
}

// getEndpointLock returns a per-endpoint mutex for serializing subscriptions.
func (km *KeyMapper) getEndpointLock(endpointTransport string) *sync.Mutex {
	km.epMu.Lock()
	defer km.epMu.Unlock()
	if mu, ok := km.epLocks[endpointTransport]; ok {
		return mu
	}
	mu := &sync.Mutex{}
	km.epLocks[endpointTransport] = mu
	return mu
}

// SubscribeAndLearn serializes subscriptions per endpoint, fires the subscribe
// function, and waits for the ZADD notification to learn the key mapping.
// The subscribeFn should send the subscription HTTP request (blocking).
func (km *KeyMapper) SubscribeAndLearn(
	endpointTransport string,
	rawCacheKey string,
	subscribeFn func(),
) {
	// Fast path: mapping already known, no lock needed.
	if _, ok := km.Get(rawCacheKey); ok {
		subscribeFn()
		return
	}

	epLock := km.getEndpointLock(endpointTransport)
	epLock.Lock()
	defer epLock.Unlock()

	// Re-check after acquiring lock — another goroutine may have learned it.
	if _, ok := km.Get(rawCacheKey); ok {
		subscribeFn()
		return
	}

	ch := make(chan zaddNotification, 1)

	km.pendingMu.Lock()
	km.pending[endpointTransport] = ch
	km.pendingMu.Unlock()

	defer func() {
		km.pendingMu.Lock()
		delete(km.pending, endpointTransport)
		km.pendingMu.Unlock()
	}()

	// Fire subscription (blocks until JS responds).
	subscribeFn()

	// Wait for ZADD notification (arrives during the HTTP request processing).
	select {
	case notif := <-ch:
		transformedKey := km.computeTransformedKey(notif)
		if transformedKey != "" {
			km.mu.Lock()
			km.mapping[rawCacheKey] = transformedKey
			km.mu.Unlock()
			km.logger.Debug("Learned key mapping", "rawKey", rawCacheKey, "transformedKey", transformedKey)
		}
	case <-time.After(zaddNotificationTimeout):
		km.logger.Debug("Timed out waiting for ZADD notification", "endpoint", endpointTransport, "rawKey", rawCacheKey)
	}
}

// NotifyZAdd is called by the Redcon ZADD handler when it detects a
// subscription set write. It sends the notification to any pending subscriber.
// The subscription set key format is "<ADAPTER>-<endpoint>-<transport>-subscriptionSet".
// We extract the canonical endpoint via findEndpointInKey and use it to match
// against pending subscribers, since we can't predict the transport name.
func (km *KeyMapper) NotifyZAdd(subscriptionSetKey, member string) {
	if !strings.HasSuffix(subscriptionSetKey, "-subscriptionSet") {
		return
	}

	canonicalEndpoint, err := findEndpointInKey(subscriptionSetKey)
	if err != nil {
		km.logger.Debug("Could not extract endpoint from ZADD key", "key", subscriptionSetKey, "error", err)
		return
	}

	subKeyPrefix := strings.TrimSuffix(subscriptionSetKey, "-subscriptionSet")

	km.pendingMu.Lock()
	ch, ok := km.pending[canonicalEndpoint]
	km.pendingMu.Unlock()

	if ok {
		select {
		case ch <- zaddNotification{
			Member:          member,
			SubscriptionKey: subKeyPrefix,
		}:
		default:
		}
	}
}

// computeTransformedKey derives the internal transformed cache key from a ZADD notification.
// It constructs a pseudo Redis key from the subscription key + member JSON,
// then uses RequestParamsFromKey to parse it into canonical params, and finally
// CalculateCacheKey to produce the deterministic internal key.
func (km *KeyMapper) computeTransformedKey(notif zaddNotification) string {
	// Build pseudo Redis key: "{subscriptionKey}-{member}"
	// subscriptionKey is like "CFBENCHMARKS-crypto-ws"
	// member is like '{"index":"LINKUSD_RTI"}'
	pseudoKey := notif.SubscriptionKey + "-" + notif.Member

	params, err := RequestParamsFromKey(pseudoKey)
	if err != nil {
		km.logger.Debug("Failed to parse params from ZADD notification", "pseudoKey", pseudoKey, "error", err)
		return ""
	}

	key, err := CalculateCacheKey(params)
	if err != nil {
		km.logger.Debug("Failed to calculate transformed cache key", "params", params, "error", err)
		return ""
	}

	return key
}

// Size returns the number of learned mappings.
func (km *KeyMapper) Size() int {
	km.mu.RLock()
	defer km.mu.RUnlock()
	return len(km.mapping)
}

