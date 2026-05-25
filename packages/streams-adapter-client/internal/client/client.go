package client

import (
	"context"
	"fmt"
	"time"

	"google.golang.org/grpc"

	pb "streams-adapter-client/gen/streams/v1"
)

// Client manages a bidirectional gRPC stream to the streams-adapter transmitter.
type Client struct {
	conn   *grpc.ClientConn
	stream pb.StreamService_SubscribeClient
	cache  *Cache
	errCh  chan error
}

// NewClient dials addr, opens the bidirectional Subscribe stream, and starts
// the background receive loop. Call Close when done.
func NewClient(ctx context.Context, addr string, cache *Cache, opts ...grpc.DialOption) (*Client, error) {
	conn, err := grpc.NewClient(addr, opts...)
	if err != nil {
		return nil, fmt.Errorf("dial %s: %w", addr, err)
	}

	svc := pb.NewStreamServiceClient(conn)
	stream, err := svc.Subscribe(ctx)
	if err != nil {
		conn.Close()
		return nil, fmt.Errorf("open stream: %w", err)
	}

	c := &Client{conn: conn, stream: stream, cache: cache, errCh: make(chan error, 1)}
	go c.recvLoop()
	return c, nil
}

// Subscribe sends a subscribe command with the given JSON payload to the server.
// payloadJSON must be the full request body, e.g. {"data":{"endpoint":"crypto",...}}.
func (c *Client) Subscribe(payloadJSON string) error {
	return c.stream.Send(&pb.SubscribeRequest{
		Action: &pb.SubscribeRequest_Subscribe{
			Subscribe: &pb.SubscribeAction{PayloadJson: payloadJSON},
		},
	})
}

// Unsubscribe sends an unsubscribe command with the given JSON payload to the server.
func (c *Client) Unsubscribe(payloadJSON string) error {
	return c.stream.Send(&pb.SubscribeRequest{
		Action: &pb.SubscribeRequest_Unsubscribe{
			Unsubscribe: &pb.UnsubscribeAction{PayloadJson: payloadJSON},
		},
	})
}

// Close half-closes the send side and closes the underlying connection.
func (c *Client) Close() {
	_ = c.stream.CloseSend()
	_ = c.conn.Close()
}

// Errors returns asynchronous stream-level errors produced by the receive loop.
func (c *Client) Errors() <-chan error {
	return c.errCh
}

func (c *Client) recvLoop() {
	for {
		resp, err := c.stream.Recv()
		if err != nil {
			select {
			case c.errCh <- err:
			default:
			}
			return
		}
		ts := time.Now()
		c.cache.Set(resp.AssetId, resp.ObservationJson, ts)
	}
}
