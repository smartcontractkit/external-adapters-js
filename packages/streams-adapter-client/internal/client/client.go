package client

import (
	"context"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/protobuf/types/known/structpb"

	pb "streams-adapter-client/gen/streams/v1"
)

// Client manages a bidirectional gRPC stream and periodically sends its full
// authoritative subscription set.
type Client struct {
	conn   *grpc.ClientConn
	stream pb.StreamService_SubscribeClient
	cache  *Cache
	errCh  chan error

	ctx    context.Context
	cancel context.CancelFunc
	sendMu sync.Mutex
	subsMu sync.RWMutex
	subs   map[string]*pb.Subscription
	wg     sync.WaitGroup
}

func NewClient(ctx context.Context, addr string, cache *Cache, refreshInterval time.Duration, opts ...grpc.DialOption) (*Client, error) {
	conn, err := grpc.NewClient(addr, opts...)
	if err != nil {
		return nil, fmt.Errorf("dial %s: %w", addr, err)
	}
	clientCtx, cancel := context.WithCancel(ctx)
	stream, err := pb.NewStreamServiceClient(conn).Subscribe(clientCtx)
	if err != nil {
		cancel()
		conn.Close()
		return nil, fmt.Errorf("open stream: %w", err)
	}
	if refreshInterval <= 0 {
		refreshInterval = time.Minute
	}
	c := &Client{conn: conn, stream: stream, cache: cache, errCh: make(chan error, 1), ctx: clientCtx, cancel: cancel, subs: make(map[string]*pb.Subscription)}
	go c.recvLoop()
	c.wg.Add(1)
	go c.refreshLoop(refreshInterval)
	return c, nil
}

// Subscribe adds the inner data from a {"data": ...} JSON request and
// immediately sends the complete subscription set.
func (c *Client) Subscribe(payloadJSON string) error {
	var request struct {
		Data map[string]interface{} `json:"data"`
	}
	if err := json.Unmarshal([]byte(payloadJSON), &request); err != nil {
		return fmt.Errorf("parse payload: %w", err)
	}
	if len(request.Data) == 0 {
		return fmt.Errorf("payload missing data field")
	}
	data, err := structpb.NewStruct(request.Data)
	if err != nil {
		return fmt.Errorf("convert payload data: %w", err)
	}
	canonical, err := json.Marshal(request.Data)
	if err != nil {
		return fmt.Errorf("canonicalize payload data: %w", err)
	}
	c.subsMu.Lock()
	c.subs[string(canonical)] = &pb.Subscription{Data: data}
	c.subsMu.Unlock()
	return c.sendSnapshot()
}

func (c *Client) sendSnapshot() error {
	c.subsMu.RLock()
	subscriptions := make([]*pb.Subscription, 0, len(c.subs))
	for _, subscription := range c.subs {
		subscriptions = append(subscriptions, subscription)
	}
	c.subsMu.RUnlock()
	c.sendMu.Lock()
	defer c.sendMu.Unlock()
	return c.stream.Send(&pb.SubscribeRequest{Subscriptions: subscriptions})
}

func (c *Client) refreshLoop(interval time.Duration) {
	defer c.wg.Done()
	ticker := time.NewTicker(interval)
	defer ticker.Stop()
	for {
		select {
		case <-c.ctx.Done():
			return
		case <-ticker.C:
			if err := c.sendSnapshot(); err != nil {
				c.reportError(err)
				return
			}
		}
	}
}

func (c *Client) Close() {
	c.cancel()
	c.wg.Wait()
	c.sendMu.Lock()
	_ = c.stream.CloseSend()
	c.sendMu.Unlock()
	_ = c.conn.Close()
}

func (c *Client) Errors() <-chan error { return c.errCh }

func (c *Client) reportError(err error) {
	select {
	case c.errCh <- err:
	default:
	}
}

func (c *Client) recvLoop() {
	for {
		resp, err := c.stream.Recv()
		if err != nil {
			if c.ctx.Err() == nil {
				c.reportError(err)
			}
			return
		}
		if len(resp.GetPayloadHash()) != 32 {
			c.reportError(fmt.Errorf("invalid payload hash length %d", len(resp.GetPayloadHash())))
			continue
		}
		ts := time.Now()
		if parsed, err := time.Parse(time.RFC3339Nano, resp.GetTimestamp()); err == nil {
			ts = parsed
		}
		c.cache.Set(hex.EncodeToString(resp.GetPayloadHash()), resp.GetObservationJson(), ts)
	}
}
