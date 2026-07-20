package transmitter

import (
	"sync"
	"time"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

// Event is emitted when a new observation arrives for a subscribed payload hash.
type Event struct {
	Timestamp       string
	ObservationJSON []byte
	PayloadHash     [32]byte
}

type subscriptionState struct {
	subscribers map[chan<- Event]struct{}
}

// Publisher distributes observations to gRPC subscribers by payload hash.
type Publisher struct {
	mu     sync.RWMutex
	assets map[[32]byte]*subscriptionState
}

// NewPublisher creates a new Publisher.
func NewPublisher() *Publisher {
	return &Publisher{
		assets: make(map[[32]byte]*subscriptionState),
	}
}

// Subscribe registers ch to receive events for payloadHash.
func (p *Publisher) Subscribe(payloadHash [32]byte, ch chan<- Event) {
	p.mu.Lock()
	defer p.mu.Unlock()

	state, exists := p.assets[payloadHash]
	if !exists {
		state = &subscriptionState{
			subscribers: make(map[chan<- Event]struct{}),
		}
		p.assets[payloadHash] = state
	}
	state.subscribers[ch] = struct{}{}
}

// Unsubscribe removes ch from payloadHash's subscriber list.
// If no subscribers remain the asset entry is cleaned up.
func (p *Publisher) Unsubscribe(payloadHash [32]byte, ch chan<- Event) {
	p.mu.Lock()
	defer p.mu.Unlock()

	state, exists := p.assets[payloadHash]
	if !exists {
		return
	}
	delete(state.subscribers, ch)
	if len(state.subscribers) == 0 {
		delete(p.assets, payloadHash)
	}
}

// Publish marshals obs to JSON and fans out an Event to payloadHash subscribers.
// Slow subscribers are skipped (non-blocking send).
func (p *Publisher) Publish(payloadHash [32]byte, obs *types.Observation, ts time.Time) {
	obsJSON, err := json.Marshal(obs)
	if err != nil {
		return
	}

	event := Event{
		Timestamp:       ts.UTC().Format(time.RFC3339Nano),
		ObservationJSON: obsJSON,
		PayloadHash:     payloadHash,
	}

	p.mu.RLock()
	defer p.mu.RUnlock()

	state, exists := p.assets[payloadHash]
	if !exists {
		return
	}
	for ch := range state.subscribers {
		select {
		case ch <- event:
		default:
			// drop if subscriber is slow
		}
	}
}
