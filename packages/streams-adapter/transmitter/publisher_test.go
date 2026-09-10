package transmitter

import (
	"testing"
	"time"

	types "streams-adapter/common"
)

func TestPublisherIncludesPayloadHashAndStopsFutureFanout(t *testing.T) {
	publisher := NewPublisher()
	events := make(chan Event, 1)
	payloadHash := [32]byte{1, 2, 3}
	publisher.Subscribe(payloadHash, events)
	publisher.Publish(payloadHash, &types.Observation{Success: true}, time.Now())

	select {
	case event := <-events:
		if event.PayloadHash != payloadHash {
			t.Fatalf("unexpected payload hash %x", event.PayloadHash)
		}
	case <-time.After(time.Second):
		t.Fatal("expected published event")
	}

	publisher.Unsubscribe(payloadHash, events)
	publisher.Publish(payloadHash, &types.Observation{Success: true}, time.Now())
	select {
	case <-events:
		t.Fatal("received event published after unsubscribe")
	default:
	}
}
