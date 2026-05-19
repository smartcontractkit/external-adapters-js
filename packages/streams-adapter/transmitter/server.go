package transmitter

import (
	"encoding/json"
	"fmt"
	"io"
	"log/slog"

	"streams-adapter/helpers"

	pb "streams-adapter/gen/streams/v1"
)

// StreamTransmitter implements the gRPC StreamServiceServer.
// It accepts bidirectional streams: clients send subscribe/unsubscribe commands
// and receive observation events for their subscribed assets.
type StreamTransmitter struct {
	pb.UnimplementedStreamServiceServer
	publisher    *Publisher
	logger       *slog.Logger
	bootstrapper func(data map[string]interface{}) error
}

// NewStreamTransmitter creates a new StreamTransmitter backed by publisher.
// bootstrapper is called when a subscribe request arrives for an asset not yet
// in the cache; pass nil to disable (fanout-only mode).
func NewStreamTransmitter(publisher *Publisher, logger *slog.Logger, bootstrapper func(map[string]interface{}) error) *StreamTransmitter {
	return &StreamTransmitter{publisher: publisher, logger: logger, bootstrapper: bootstrapper}
}

// normalizePayloadJSON parses a JSON payload (identical to the HTTP adapter
// request body: {"data":{...}}) and returns the canonical cache key using the
// same path as adapterHandler: BuildCacheKeyParams → CalculateCacheKey.
func normalizePayloadJSON(payloadJSON string) (string, error) {
	var req struct {
		Data map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal([]byte(payloadJSON), &req); err != nil {
		return "", fmt.Errorf("parse payload: %w", err)
	}
	if len(req.Data) == 0 {
		return "", fmt.Errorf("payload missing \"data\" field")
	}
	rawParams, err := helpers.BuildCacheKeyParams(req.Data)
	if err != nil {
		return "", err
	}
	return helpers.CalculateCacheKey(rawParams)
}

// Subscribe handles a single bidirectional gRPC stream.
func (s *StreamTransmitter) Subscribe(stream pb.StreamService_SubscribeServer) error {
	eventCh := make(chan Event, 64)
	subscribed := make(map[string]struct{}) // canonical key → registered

	// Cleanup all subscriptions when client disconnects.
	defer func() {
		for assetID := range subscribed {
			s.publisher.Unsubscribe(assetID, eventCh)
		}
		close(eventCh)
	}()

	// Goroutine: forward events to the client.
	errCh := make(chan error, 1)
	go func() {
		for event := range eventCh {
			resp := &pb.SubscribeResponse{
				AssetId:         event.AssetID,
				Timestamp:       event.Timestamp,
				ObservationJson: event.ObservationJSON,
			}
			if err := stream.Send(resp); err != nil {
				errCh <- err
				return
			}
		}
	}()

	// Main loop: read subscribe/unsubscribe commands from the client.
	for {
		select {
		case err := <-errCh:
			return err
		default:
		}

		req, err := stream.Recv()
		if err == io.EOF {
			return nil
		}
		if err != nil {
			return err
		}

		switch action := req.Action.(type) {
		case *pb.SubscribeRequest_Subscribe:
			assetID, err := normalizePayloadJSON(action.Subscribe.PayloadJson)
			if err != nil {
				s.logger.Warn("subscribe: invalid payload", "payload", action.Subscribe.PayloadJson, "error", err)
				continue
			}
			if _, already := subscribed[assetID]; !already {
				subscribed[assetID] = struct{}{}
				s.publisher.Subscribe(assetID, eventCh)
				s.logger.Info("client subscribed", "asset_id", assetID)
				if s.bootstrapper != nil {
					var req struct {
						Data map[string]interface{} `json:"data"`
					}
					if err := json.Unmarshal([]byte(action.Subscribe.PayloadJson), &req); err == nil && len(req.Data) > 0 {
						if err := s.bootstrapper(req.Data); err != nil {
							s.logger.Warn("bootstrap subscription failed", "asset_id", assetID, "error", err)
						}
					}
				}
			}
		case *pb.SubscribeRequest_Unsubscribe:
			assetID, err := normalizePayloadJSON(action.Unsubscribe.PayloadJson)
			if err != nil {
				s.logger.Warn("unsubscribe: invalid payload", "payload", action.Unsubscribe.PayloadJson, "error", err)
				continue
			}
			if _, ok := subscribed[assetID]; ok {
				s.publisher.Unsubscribe(assetID, eventCh)
				delete(subscribed, assetID)
				s.logger.Info("client unsubscribed", "asset_id", assetID)
			}
		}
	}
}
