package transmitter

import (
	"errors"
	"testing"

	types "streams-adapter/common"

	pb "streams-adapter/gen/streams/v1"
	"google.golang.org/protobuf/types/known/structpb"
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

func TestNormalizeSnapshotDiscardsMissingData(t *testing.T) {
	server := &StreamTransmitter{resolver: func(map[string]interface{}) (*types.ResolvedSubscription, error) {
		return &types.ResolvedSubscription{}, nil
	}}
	normalized, err := server.normalizeSnapshot(&pb.SubscribeRequest{Subscriptions: []*pb.Subscription{{}}})
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(normalized) != 0 {
		t.Fatalf("expected 0 valid subscriptions, got %d", len(normalized))
	}
}

func TestNormalizeSnapshotDiscardsInvalidItemsAndKeepsValidOnes(t *testing.T) {
	server := &StreamTransmitter{resolver: func(data map[string]interface{}) (*types.ResolvedSubscription, error) {
		if data["valid"] == true {
			return &types.ResolvedSubscription{}, nil
		}
		return nil, errors.New("resolver error")
	}}

	validSub, err := makeSubscription(map[string]interface{}{"valid": true})
	if err != nil {
		t.Fatalf("failed to create valid subscription: %v", err)
	}
	invalidSub, err := makeSubscription(map[string]interface{}{"valid": false})
	if err != nil {
		t.Fatalf("failed to create invalid subscription: %v", err)
	}

	req := &pb.SubscribeRequest{Subscriptions: []*pb.Subscription{
		validSub,
		invalidSub,
		{},
		validSub,
	}}

	normalized, err := server.normalizeSnapshot(req)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if len(normalized) != 2 {
		t.Fatalf("expected 2 valid subscriptions, got %d", len(normalized))
	}
}

func makeSubscription(data map[string]interface{}) (*pb.Subscription, error) {
	structData, err := structpb.NewStruct(data)
	if err != nil {
		return nil, err
	}
	return &pb.Subscription{Data: structData}, nil
}
