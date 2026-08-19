package transmitter

import (
	"encoding/hex"
	"fmt"
	"io"
	"log/slog"
	"time"

	types "streams-adapter/common"

	pb "streams-adapter/gen/streams/v1"
)

// StreamTransmitter implements the gRPC StreamServiceServer. Each request on a
// stream is an authoritative replacement of that client's subscription set.
type StreamTransmitter struct {
	pb.UnimplementedStreamServiceServer
	publisher      *Publisher
	logger         *slog.Logger
	resolver       func(data map[string]interface{}) (*types.ResolvedSubscription, error)
	ensure         func(resolved *types.ResolvedSubscription) *types.CacheItem
	refreshTimeout time.Duration
}

// NewStreamTransmitter creates a transmitter backed by publisher. Subscriptions
// are cleared when no valid snapshot is received within refreshTimeout.
func NewStreamTransmitter(
	publisher *Publisher,
	logger *slog.Logger,
	resolver func(map[string]interface{}) (*types.ResolvedSubscription, error),
	ensure func(*types.ResolvedSubscription) *types.CacheItem,
	refreshTimeout time.Duration,
) *StreamTransmitter {
	return &StreamTransmitter{
		publisher: publisher, logger: logger, resolver: resolver, ensure: ensure, refreshTimeout: refreshTimeout,
	}
}

type normalizedSubscription struct {
	resolved *types.ResolvedSubscription
}

// normalizeSnapshot validates the complete snapshot before any subscription
// registrations are changed.
func (s *StreamTransmitter) normalizeSnapshot(req *pb.SubscribeRequest) ([]normalizedSubscription, error) {
	if len(req.GetSubscriptions()) > 0 && s.resolver == nil {
		return nil, fmt.Errorf("subscription resolver is not configured")
	}
	result := make([]normalizedSubscription, 0, len(req.GetSubscriptions()))
	for i, subscription := range req.GetSubscriptions() {
		if subscription == nil || subscription.GetData() == nil {
			return nil, fmt.Errorf("subscription %d is missing data", i)
		}
		data := subscription.GetData().AsMap()
		resolved, err := s.resolver(data)
		if err != nil {
			return nil, fmt.Errorf("subscription %d: %w", i, err)
		}
		result = append(result, normalizedSubscription{resolved: resolved})
	}
	return result, nil
}

func resetTimer(timer *time.Timer, duration time.Duration) {
	if !timer.Stop() {
		select {
		case <-timer.C:
		default:
		}
	}
	timer.Reset(duration)
}

// Subscribe handles a single bidirectional gRPC stream.
func (s *StreamTransmitter) Subscribe(stream pb.StreamService_SubscribeServer) error {
	eventCh := make(chan Event, 64)
	subscribed := make(map[[32]byte]struct{})

	clearSubscriptions := func() {
		for payloadHash := range subscribed {
			s.publisher.Unsubscribe(payloadHash, eventCh)
			delete(subscribed, payloadHash)
		}
	}
	defer func() {
		clearSubscriptions()
		close(eventCh)
	}()

	errCh := make(chan error, 1)
	go func() {
		for event := range eventCh {
			payloadHash := make([]byte, len(event.PayloadHash))
			copy(payloadHash, event.PayloadHash[:])
			if err := stream.Send(&pb.SubscribeResponse{
				Timestamp:       event.Timestamp,
				ObservationJson: event.ObservationJSON, PayloadHash: payloadHash,
			}); err != nil {
				select {
				case errCh <- err:
				default:
				}
				return
			}
		}
	}()

	recvCh := make(chan *pb.SubscribeRequest, 1)
	go func() {
		for {
			req, err := stream.Recv()
			if err != nil {
				errCh <- err
				return
			}
			recvCh <- req
		}
	}()

	refreshTimeout := s.refreshTimeout
	if refreshTimeout <= 0 {
		refreshTimeout = 3 * time.Minute
	}
	timer := time.NewTimer(refreshTimeout)
	defer timer.Stop()

	for {
		select {
		case err := <-errCh:
			if err == io.EOF {
				return nil
			}
			return err
		case <-timer.C:
			clearSubscriptions()
			s.logger.Info("client subscriptions expired")
			timer.Reset(refreshTimeout)
		case req := <-recvCh:
			normalized, err := s.normalizeSnapshot(req)
			if err != nil {
				s.logger.Warn("invalid subscription snapshot", "error", err)
				continue
			}

			next := make(map[[32]byte]struct{}, len(normalized))
			for _, subscription := range normalized {
				next[subscription.resolved.PayloadHash] = struct{}{}
			}
			for payloadHash := range subscribed {
				if _, keep := next[payloadHash]; !keep {
					s.publisher.Unsubscribe(payloadHash, eventCh)
					delete(subscribed, payloadHash)
					s.logger.Info("client subscription removed", "payload_hash", hex.EncodeToString(payloadHash[:]))
				}
			}
			for _, subscription := range normalized {
				payloadHash := subscription.resolved.PayloadHash
				if _, already := subscribed[payloadHash]; !already {
					s.publisher.Subscribe(payloadHash, eventCh)
					subscribed[payloadHash] = struct{}{}
					s.logger.Info("client subscription added", "payload_hash", hex.EncodeToString(payloadHash[:]))
				}
				if s.ensure != nil {
					s.ensure(subscription.resolved)
				}
			}
			resetTimer(timer, refreshTimeout)
		}
	}
}
