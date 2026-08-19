package transmitter

import (
	"testing"

	pb "streams-adapter/gen/streams/v1"
)

func TestNormalizeSnapshotAcceptsEmptySnapshot(t *testing.T) {
	server := &StreamTransmitter{}
	normalized, err := server.normalizeSnapshot(&pb.SubscribeRequest{})
	if err != nil {
		t.Fatalf("normalize empty snapshot: %v", err)
	}
	if len(normalized) != 0 {
		t.Fatalf("expected empty snapshot, got %d entries", len(normalized))
	}
}

func TestNormalizeSnapshotRejectsMissingData(t *testing.T) {
	server := &StreamTransmitter{}
	_, err := server.normalizeSnapshot(&pb.SubscribeRequest{Subscriptions: []*pb.Subscription{{}}})
	if err == nil {
		t.Fatal("expected missing data error")
	}
}
