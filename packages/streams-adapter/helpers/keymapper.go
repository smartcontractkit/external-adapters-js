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
	pending   map[string]chan zaddNotification // canonical endpoint → channel

	// phase1InFlight tracks the raw cache keys of subscriptions whose Phase-1
	// HTTP request is still in-flight (sent but response not yet received).
	// Keyed by canonical endpoint; values are sets of rawCacheKey strings.
	// When a ZADD arrives and its computed transformedKey matches one of these
	// keys, the ZADD originated from a concurrent Phase-1 request and must be
	// dropped so it is not mistakenly attributed to a Phase-2 SubscribeAndLearn.
	phase1Mu       sync.Mutex
	phase1InFlight map[string]map[string]struct{} // endpoint → rawCacheKey set

	epMu    sync.Mutex
	epLocks map[string]*sync.Mutex

	logger *slog.Logger
}

type zaddNotification struct {
	Member          string // JSON member from ZADD (transformed params)
	SubscriptionKey string // ZADD key minus "-subscriptionSet" suffix
}

// NewKeyMapper creates a new KeyMapper instance.
func NewKeyMapper(logger *slog.Logger) *KeyMapper {
	return &KeyMapper{
		mapping:        make(map[string]string),
		pending:        make(map[string]chan zaddNotification),
		phase1InFlight: make(map[string]map[string]struct{}),
		epLocks:        make(map[string]*sync.Mutex),
		logger:         logger,
	}
}

// RegisterPhase1InFlight marks rawCacheKey as having an active Phase-1
// subscribe HTTP request in-flight for the given endpoint.
// Must be called before the Phase-1 subscribeToAsset call.
func (km *KeyMapper) RegisterPhase1InFlight(endpoint, rawCacheKey string) {
	km.phase1Mu.Lock()
	defer km.phase1Mu.Unlock()
	if km.phase1InFlight[endpoint] == nil {
		km.phase1InFlight[endpoint] = make(map[string]struct{})
	}
	km.phase1InFlight[endpoint][rawCacheKey] = struct{}{}
}

// DeregisterPhase1InFlight removes rawCacheKey from the in-flight set once
// Phase-1's HTTP response has been received (and the ZADD already processed).
func (km *KeyMapper) DeregisterPhase1InFlight(endpoint, rawCacheKey string) {
	km.phase1Mu.Lock()
	defer km.phase1Mu.Unlock()
	if s, ok := km.phase1InFlight[endpoint]; ok {
		delete(s, rawCacheKey)
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
//
// To prevent Phase-1 ZADDs from other goroutines being delivered to the
// goroutine currently waiting in SubscribeAndLearn, we first compute the
// transformedKey from the ZADD member and check the phase1InFlight set:
//   - If transformedKey is in the in-flight set the ZADD was triggered by a
//     concurrent Phase-1 subscribe on the same endpoint (possibly for a
//     different symbol). Drop it so it cannot corrupt the Phase-2 mapping.
//   - Otherwise deliver to the endpoint channel as normal.
//
// This filter is effective for adapters where rawCacheKey == transformedKey
// (no param transformation, e.g. cfbenchmarks).  For adapters that do
// transform params (rawCacheKey != transformedKey) the in-flight check finds
// no match and the ZADD falls through to the original endpoint-based delivery
// — identical to the pre-fix behaviour.
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

	notif := zaddNotification{
		Member:          member,
		SubscriptionKey: subKeyPrefix,
	}

	// Compute the transformed cache key from the ZADD member params.
	transformedKey := km.computeTransformedKey(notif)
	if transformedKey != "" {
		km.phase1Mu.Lock()
		_, isPhase1 := km.phase1InFlight[canonicalEndpoint][transformedKey]
		if isPhase1 {
			// Deregister on first ZADD arrival — the HTTP-response fallback in
			// server.go becomes a no-op. Drop the notification so it cannot be
			// delivered to the Phase-2 SubscribeAndLearn goroutine waiting on
			// the same endpoint.
			delete(km.phase1InFlight[canonicalEndpoint], transformedKey)
			km.phase1Mu.Unlock()
			return
		}
		km.phase1Mu.Unlock()
	}

	km.pendingMu.Lock()
	ch, ok := km.pending[canonicalEndpoint]
	km.pendingMu.Unlock()

	if ok {
		select {
		case ch <- notif:
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
