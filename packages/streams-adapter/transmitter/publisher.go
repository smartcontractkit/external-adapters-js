package transmitter

import (
	"sync"
	"time"

	"github.com/goccy/go-json"

	types "streams-adapter/common"
)

// Event is emitted to subscribers whenever a new observation arrives for an asset.
type Event struct {
	AssetID         string
	Timestamp       string
	ObservationJSON []byte
}

type assetState struct {
	subscribers map[chan<- Event]struct{}
}

// Publisher distributes incoming observations to all gRPC subscribers of an asset.
type Publisher struct {
	mu     sync.RWMutex
	assets map[string]*assetState
}

// NewPublisher creates a new Publisher.
func NewPublisher() *Publisher {
	return &Publisher{
		assets: make(map[string]*assetState),
	}
}

// Subscribe registers ch to receive events for assetID.
func (p *Publisher) Subscribe(assetID string, ch chan<- Event) {
	p.mu.Lock()
	defer p.mu.Unlock()

	state, exists := p.assets[assetID]
	if !exists {
		state = &assetState{
			subscribers: make(map[chan<- Event]struct{}),
		}
		p.assets[assetID] = state
	}
	state.subscribers[ch] = struct{}{}
}

// Unsubscribe removes ch from assetID's subscriber list.
// If no subscribers remain the asset entry is cleaned up.
func (p *Publisher) Unsubscribe(assetID string, ch chan<- Event) {
	p.mu.Lock()
	defer p.mu.Unlock()

	state, exists := p.assets[assetID]
	if !exists {
		return
	}
	delete(state.subscribers, ch)
	if len(state.subscribers) == 0 {
		delete(p.assets, assetID)
	}
}

// Publish marshals obs to JSON and fans out an Event to all subscribers of assetID.
// Slow subscribers are skipped (non-blocking send).
func (p *Publisher) Publish(assetID string, obs *types.Observation, ts time.Time) {
	obsJSON, err := json.Marshal(obs)
	if err != nil {
		return
	}

	event := Event{
		AssetID:         assetID,
		Timestamp:       ts.UTC().Format(time.RFC3339Nano),
		ObservationJSON: obsJSON,
	}

	p.mu.RLock()
	defer p.mu.RUnlock()

	state, exists := p.assets[assetID]
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
