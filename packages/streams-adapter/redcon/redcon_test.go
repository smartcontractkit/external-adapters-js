package redcon

import (
	"fmt"
	"log/slog"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	cache "streams-adapter/cache"
	"streams-adapter/helpers"

	"github.com/goccy/go-json"
	"github.com/stretchr/testify/require"
	"github.com/tidwall/redcon"
	"streams-adapter/transmitter"
)

// ---------------------------------------------------------------------------
// Mock connection
// ---------------------------------------------------------------------------

// writeEntry represents a single write operation on the mock connection.
type writeEntry struct {
	kind  string // "string", "bulk", "int", "int64", "uint64", "array", "null", "error", "raw", "any"
	value interface{}
}

type mockConn struct {
	writes []writeEntry
	closed bool
}

func newMockConn() *mockConn               { return &mockConn{} }
func (m *mockConn) RemoteAddr() string     { return "127.0.0.1:12345" }
func (m *mockConn) Close() error           { m.closed = true; return nil }
func (m *mockConn) WriteError(msg string)  { m.writes = append(m.writes, writeEntry{"error", msg}) }
func (m *mockConn) WriteString(str string) { m.writes = append(m.writes, writeEntry{"string", str}) }
func (m *mockConn) WriteBulk(bulk []byte) {
	m.writes = append(m.writes, writeEntry{"bulk", string(bulk)})
}
func (m *mockConn) WriteBulkString(bulk string) {
	m.writes = append(m.writes, writeEntry{"bulk", bulk})
}
func (m *mockConn) WriteInt(num int)       { m.writes = append(m.writes, writeEntry{"int", num}) }
func (m *mockConn) WriteInt64(num int64)   { m.writes = append(m.writes, writeEntry{"int64", num}) }
func (m *mockConn) WriteUint64(num uint64) { m.writes = append(m.writes, writeEntry{"uint64", num}) }
func (m *mockConn) WriteArray(count int)   { m.writes = append(m.writes, writeEntry{"array", count}) }
func (m *mockConn) WriteNull()             { m.writes = append(m.writes, writeEntry{"null", nil}) }
func (m *mockConn) WriteRaw(data []byte) {
	m.writes = append(m.writes, writeEntry{"raw", string(data)})
}
func (m *mockConn) WriteAny(any interface{})       { m.writes = append(m.writes, writeEntry{"any", any}) }
func (m *mockConn) Context() interface{}           { return nil }
func (m *mockConn) SetContext(v interface{})       {}
func (m *mockConn) SetReadBuffer(bytes int)        {}
func (m *mockConn) Detach() redcon.DetachedConn    { return nil }
func (m *mockConn) ReadPipeline() []redcon.Command { return nil }
func (m *mockConn) PeekPipeline() []redcon.Command { return nil }
func (m *mockConn) NetConn() net.Conn              { return nil }

func (m *mockConn) stringAt(i int) string {
	if i >= len(m.writes) {
		return ""
	}
	if s, ok := m.writes[i].value.(string); ok {
		return s
	}
	return fmt.Sprintf("%v", m.writes[i].value)
}

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

func newTestServer() (*RedconServer, func()) {
	c := cache.New(cache.Config{
		TTL:             time.Minute,
		CleanupInterval: time.Hour, // no cleanup during tests
	})
	srv := New(Config{
		Addr:   ":0",
		Cache:  c,
		Logger: slog.Default(),
	})
	return srv, c.Stop
}

// makeCmd builds a redcon.Command with the given string arguments.
func makeCmd(args ...string) redcon.Command {
	raw := make([][]byte, len(args))
	for i, a := range args {
		raw[i] = []byte(a)
	}
	return redcon.Command{Args: raw}
}

// ---------------------------------------------------------------------------
// handleCommand dispatch tests
// ---------------------------------------------------------------------------

func TestHandleCommand_Ping(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("PING"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "string", conn.writes[0].kind)
	require.Equal(t, "PONG", conn.writes[0].value)
}

func TestHandleCommand_Info(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("INFO"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "bulk", conn.writes[0].kind)
	s, ok := conn.writes[0].value.(string)
	if !ok || !strings.Contains(s, "redis_version") {
		t.Errorf("INFO response missing redis_version: %v", conn.writes[0].value)
	}
}

func TestHandleCommand_Quit(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("QUIT"))

	if len(conn.writes) == 0 {
		t.Fatal("expected at least 1 write")
	}
	require.Equal(t, "OK", conn.writes[0].value)
	if !conn.closed {
		t.Error("expected connection to be closed after QUIT")
	}
}

func TestHandleCommand_Auth(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("AUTH", "password123"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "OK", conn.writes[0].value)
}

func TestHandleCommand_Multi(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("MULTI"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "OK", conn.writes[0].value)
}

func TestHandleCommand_Exec(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("EXEC"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "array", conn.writes[0].kind)
	require.Equal(t, 0, conn.writes[0].value)
}

func TestHandleCommand_Get(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("GET"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "null", conn.writes[0].kind)
}

func TestHandleCommand_PExpire(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("PEXPIRE", "key", "1000"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "int", conn.writes[0].kind)
	require.Equal(t, 1, conn.writes[0].value)
}

func TestHandleCommand_UnknownCommand(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("FOOBAR"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "error", conn.writes[0].kind)
	errMsg, _ := conn.writes[0].value.(string)
	if !strings.Contains(errMsg, "unknown command") {
		t.Errorf("error should mention 'unknown command', got: %s", errMsg)
	}
}

func TestHandleCommand_EmptyCommand(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, redcon.Command{})

	require.Len(t, conn.writes, 1)
	require.Equal(t, "error", conn.writes[0].kind)
	errMsg, _ := conn.writes[0].value.(string)
	if !strings.Contains(errMsg, "empty command") {
		t.Errorf("error should mention 'empty command', got: %s", errMsg)
	}
}

// ---------------------------------------------------------------------------
// CLIENT subcommand tests
// ---------------------------------------------------------------------------

func TestHandleCommand_ClientSetinfo(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("CLIENT", "SETINFO", "lib-name", "go-redis"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "OK", conn.writes[0].value)
}

func TestHandleCommand_ClientSetname(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("CLIENT", "SETNAME", "myconn"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "OK", conn.writes[0].value)
}

func TestHandleCommand_ClientGetname(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("CLIENT", "GETNAME"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "null", conn.writes[0].kind)
}

// ---------------------------------------------------------------------------
// ZADD tests
// ---------------------------------------------------------------------------

func TestHandleCommand_ZAdd(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZADD", "myset", "1.5", "member1"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "int", conn.writes[0].kind)
	require.Equal(t, 1, conn.writes[0].value)

	// Verify sorted set state
	srv.mu.RLock()
	score, exists := srv.sortedSets["myset"]["member1"]
	srv.mu.RUnlock()
	if !exists {
		t.Fatal("member1 not found in sorted set")
	}
	require.Equal(t, 1.5, score)
}

func TestHandleCommand_ZAddExistingMember(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()

	// Add initial member
	conn1 := newMockConn()
	srv.handleCommand(conn1, makeCmd("ZADD", "myset", "1.0", "member1"))

	// Update score for same member
	conn2 := newMockConn()
	srv.handleCommand(conn2, makeCmd("ZADD", "myset", "2.0", "member1"))

	require.Equal(t, "int", conn2.writes[0].kind)
	require.Equal(t, 0, conn2.writes[0].value)

	srv.mu.RLock()
	score := srv.sortedSets["myset"]["member1"]
	srv.mu.RUnlock()
	require.Equal(t, 2.0, score)
}

func TestHandleCommand_ZAddTooFewArgs(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZADD", "myset", "1.0"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "error", conn.writes[0].kind)
}

func TestHandleCommand_ZAddInvalidScore(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZADD", "myset", "notanumber", "member1"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "error", conn.writes[0].kind)
}

// ---------------------------------------------------------------------------
// ZREMRANGEBYSCORE tests
// ---------------------------------------------------------------------------

func TestHandleCommand_ZRemRangeByScore(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()

	// Populate sorted set
	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "1.0", "a"))
	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "2.0", "b"))
	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "3.0", "c"))
	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "4.0", "d"))

	// Remove members with score in [2.0, 3.0]
	conn := newMockConn()
	srv.handleCommand(conn, makeCmd("ZREMRANGEBYSCORE", "myset", "2", "3"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "int", conn.writes[0].kind)
	require.Equal(t, 2, conn.writes[0].value)

	// Verify remaining members
	srv.mu.RLock()
	zset := srv.sortedSets["myset"]
	srv.mu.RUnlock()
	require.Len(t, zset, 2)
	if _, ok := zset["a"]; !ok {
		t.Error("member 'a' should remain")
	}
	if _, ok := zset["d"]; !ok {
		t.Error("member 'd' should remain")
	}
}

func TestHandleCommand_ZRemRangeByScore_NonExistentKey(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZREMRANGEBYSCORE", "nokey", "0", "100"))

	require.Equal(t, "int", conn.writes[0].kind)
	require.Equal(t, 0, conn.writes[0].value)
}

func TestHandleCommand_ZRemRangeByScore_RemovesAll(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()

	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "1.0", "a"))
	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "2.0", "b"))

	conn := newMockConn()
	srv.handleCommand(conn, makeCmd("ZREMRANGEBYSCORE", "myset", "0", "10"))

	require.Equal(t, "int", conn.writes[0].kind)
	require.Equal(t, 2, conn.writes[0].value)

	// Sorted set key should be cleaned up
	srv.mu.RLock()
	_, exists := srv.sortedSets["myset"]
	srv.mu.RUnlock()
	if exists {
		t.Error("expected sorted set key to be removed when empty")
	}
}

func TestHandleCommand_ZRemRangeByScore_WrongArgCount(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZREMRANGEBYSCORE", "myset", "0"))

	require.Equal(t, "error", conn.writes[0].kind)
}

func TestHandleCommand_ZRemRangeByScore_InvalidMin(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZREMRANGEBYSCORE", "myset", "abc", "10"))

	require.Equal(t, "error", conn.writes[0].kind)
}

func TestHandleCommand_ZRemRangeByScore_InvalidMax(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZREMRANGEBYSCORE", "myset", "0", "xyz"))

	require.Equal(t, "error", conn.writes[0].kind)
}

// ---------------------------------------------------------------------------
// ZRANGE tests
// ---------------------------------------------------------------------------

func TestHandleCommand_ZRange(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()

	// Add members in non-sorted order
	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "3.0", "c"))
	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "1.0", "a"))
	srv.handleCommand(newMockConn(), makeCmd("ZADD", "myset", "2.0", "b"))

	conn := newMockConn()
	srv.handleCommand(conn, makeCmd("ZRANGE", "myset", "0", "-1"))

	// Expect: array header + 3 bulk strings sorted by score
	require.Len(t, conn.writes, 4)
	require.Equal(t, "array", conn.writes[0].kind)
	require.Equal(t, 3, conn.writes[0].value)
	expected := []string{"a", "b", "c"}
	for i, exp := range expected {
		got := conn.stringAt(i + 1)
		require.Equal(t, exp, got)
	}
}

func TestHandleCommand_ZRange_NonExistentKey(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZRANGE", "nokey", "0", "-1"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "array", conn.writes[0].kind)
	require.Equal(t, 0, conn.writes[0].value)
}

func TestHandleCommand_ZRange_TooFewArgs(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("ZRANGE"))

	require.Equal(t, "error", conn.writes[0].kind)
}

// ---------------------------------------------------------------------------
// EVAL / EVALSHA test
// ---------------------------------------------------------------------------

func TestHandleCommand_EvalSha(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	// EVALSHA should be handled the same as EVAL
	srv.handleCommand(conn, makeCmd("EVALSHA", "sha1hash", "1", "badkey", `{"data":{}}`))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "int", conn.writes[0].kind)
}

func TestHandleCommand_EvalTooFewArgs(t *testing.T) {
	srv, stop := newTestServer()
	defer stop()
	conn := newMockConn()

	srv.handleCommand(conn, makeCmd("EVAL", "script", "1", "only-key"))

	require.Len(t, conn.writes, 1)
	require.Equal(t, "error", conn.writes[0].kind)
	errMsg, _ := conn.writes[0].value.(string)
	if !strings.Contains(errMsg, "wrong number of arguments") {
		t.Errorf("error should mention 'wrong number of arguments', got: %s", errMsg)
	}
}

func TestHandleCommand_Eval_FansOutToMultiplePayloadHashes(t *testing.T) {
	c := cache.New(cache.Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()

	pub := transmitter.NewPublisher()
	srv := New(Config{
		Addr:      ":0",
		Cache:     c,
		Publisher: pub,
		Logger:    slog.Default(),
	})

	rawKey := "endpoint=cryptolwba:from=btc:to=usd"
	transformedKey := "base=btc:endpoint=cryptolwba:quote=usd"
	hash1 := [32]byte{1, 2, 3}
	hash2 := [32]byte{4, 5, 6}

	c.SetNew(rawKey, nil, hash1)
	c.AddPayloadHash(rawKey, hash2)
	c.SetTransformedKey(rawKey, transformedKey)

	ch1 := make(chan transmitter.Event, 1)
	ch2 := make(chan transmitter.Event, 1)
	pub.Subscribe(hash1, ch1)
	pub.Subscribe(hash2, ch2)

	adapterKey := "prefix-adapter-endpoint-transport-" + transformedKey
	value := `{"data":{"ask":"1"},"timestamps":{},"meta":{},"result":"1"}`
	conn := newMockConn()
	srv.handleCommand(conn, makeCmd("EVAL", "script", "1", adapterKey, value))

	select {
	case e := <-ch1:
		require.Equal(t, hash1, e.PayloadHash)
	case <-time.After(time.Second):
		t.Fatal("subscriber on hash1 did not receive observation")
	}
	select {
	case e := <-ch2:
		require.Equal(t, hash2, e.PayloadHash)
	case <-time.After(time.Second):
		t.Fatal("subscriber on hash2 did not receive observation")
	}
}

// ---------------------------------------------------------------------------
// Transport-aware cache keys
// ---------------------------------------------------------------------------

// initDxfeedAliases points the package-level alias index at an adapter with a
// `price` endpoint, so adapter keys carrying a JSON params blob resolve.
func initDxfeedAliases(t *testing.T) {
	t.Helper()
	path := filepath.Join(t.TempDir(), "endpoint_aliases.json")
	require.NoError(t, os.WriteFile(path, []byte(
		`{"adapters":{"dxfeed":{"defaultEndpoint":"price","endpoints":{"price":{"aliases":["stock"]}}}}}`,
	), 0o644))
	require.NoError(t, helpers.InitAliasIndex("dxfeed", path))
}

// Two live streams target the same dxFeed symbol and differ only by transport:
// BIL/USD-Streams-RegularHoursEquityPrice omits `transport` and falls through to
// the price endpoint's defaultTransport (`rest`), while
// BIL/USD-Streams-OvernightHoursEquityPrice asks for `ws`. The framework strips
// `transport` before building its params blob, so both used to derive
// `base=bil:uslf24:endpoint=price` and share one cache slot, each route's write
// overwriting the other's observation.
func TestHandleCommand_Eval_TransportsDoNotShareACacheSlot(t *testing.T) {
	initDxfeedAliases(t)

	c := cache.New(cache.Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()

	pub := transmitter.NewPublisher()
	srv := New(Config{
		Addr:      ":0",
		Cache:     c,
		Publisher: pub,
		Logger:    slog.Default(),
	})

	const (
		restRawKey = "endpoint=price:from=bil:uslf24:to=usd"
		wsRawKey   = "endpoint=price:from=bil:uslf24:to=usd:transport=ws"
	)
	restHash := [32]byte{1}
	wsHash := [32]byte{2}

	c.SetNew(restRawKey, nil, restHash)
	c.SetNew(wsRawKey, nil, wsHash)
	c.SetTransformedKey(restRawKey, "base=bil:uslf24:endpoint=price:transport=rest")
	c.SetTransformedKey(wsRawKey, "base=bil:uslf24:endpoint=price:transport=ws")

	restCh := make(chan transmitter.Event, 1)
	wsCh := make(chan transmitter.Event, 1)
	pub.Subscribe(restHash, restCh)
	pub.Subscribe(wsHash, wsCh)

	// The REST route caches the last regular-session trade.
	srv.handleCommand(newMockConn(), makeCmd("EVAL", "script", "1",
		`dxfeed-data-streams-DXFEED-price-rest-{"base":"bil:uslf24"}`,
		`{"data":{"result":91.59},"meta":{"transportName":"rest"},"result":91.59}`))

	select {
	case e := <-restCh:
		require.Equal(t, restHash, e.PayloadHash)
		require.Contains(t, string(e.ObservationJSON), "91.59")
	case <-time.After(time.Second):
		t.Fatal("rest subscriber did not receive the rest observation")
	}
	select {
	case e := <-wsCh:
		t.Fatalf("ws subscriber received the rest observation: %s", e.ObservationJSON)
	case <-time.After(100 * time.Millisecond):
	}

	// The WS route caches the overnight trade; each subscriber sees only its own
	// transport's value.
	srv.handleCommand(newMockConn(), makeCmd("EVAL", "script", "1",
		`dxfeed-data-streams-DXFEED-price-ws-{"base":"bil:uslf24"}`,
		`{"data":{"result":91.58},"meta":{"transportName":"ws"},"result":91.58}`))

	select {
	case e := <-wsCh:
		require.Equal(t, wsHash, e.PayloadHash)
		require.Contains(t, string(e.ObservationJSON), "91.58")
	case <-time.After(time.Second):
		t.Fatal("ws subscriber did not receive the ws observation")
	}

	restItem := c.Get(restRawKey)
	require.NotNil(t, restItem.Observation)
	require.Contains(t, string(restItem.Observation.Data), "91.59",
		"the ws write must not overwrite the rest slot")
}

// handleEval runs on every observation, so the transformed key is derived once
// per adapter key and reused. One entry per distinct key, no matter how many
// observations arrive on it.
func TestHandleCommand_Eval_DerivesTransformedKeyOncePerAdapterKey(t *testing.T) {
	initDxfeedAliases(t)

	c := cache.New(cache.Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()

	srv := New(Config{
		Addr:   ":0",
		Cache:  c,
		Logger: slog.Default(),
	})

	const (
		restKey = `dxfeed-data-streams-DXFEED-price-rest-{"base":"bil:uslf24"}`
		wsKey   = `dxfeed-data-streams-DXFEED-price-ws-{"base":"bil:uslf24"}`
	)
	for i := 0; i < 50; i++ {
		srv.handleCommand(newMockConn(), makeCmd("EVAL", "script", "1", restKey,
			`{"data":{"result":91.59},"meta":{"transportName":"rest"},"result":91.59}`))
		srv.handleCommand(newMockConn(), makeCmd("EVAL", "script", "1", wsKey,
			`{"data":{"result":91.58},"meta":{"transportName":"ws"},"result":91.58}`))
	}

	srv.transformedKeysMu.RLock()
	defer srv.transformedKeysMu.RUnlock()
	require.Len(t, srv.transformedKeys, 2, "100 observations across 2 adapter keys")
	require.Equal(t, "base=bil:uslf24:endpoint=price:transport=rest", srv.transformedKeys[restKey])
	require.Equal(t, "base=bil:uslf24:endpoint=price:transport=ws", srv.transformedKeys[wsKey])
}

// Malformed keys must not be memoized, or a single bad key would pin a bogus
// entry; they stay on the error path every time.
func TestHandleCommand_Eval_DoesNotMemoizeDerivationFailures(t *testing.T) {
	initDxfeedAliases(t)

	c := cache.New(cache.Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()

	srv := New(Config{
		Addr:   ":0",
		Cache:  c,
		Logger: slog.Default(),
	})

	// No endpoint alias matches "unknown", so derivation fails.
	srv.handleCommand(newMockConn(), makeCmd("EVAL", "script", "1",
		`adapter-unknown-{"base":"bil:uslf24"}`,
		`{"data":{"result":1},"meta":{"transportName":"rest"},"result":1}`))

	srv.transformedKeysMu.RLock()
	defer srv.transformedKeysMu.RUnlock()
	require.Empty(t, srv.transformedKeys)
}

// BenchmarkHandleEval measures the per-observation path, which is the one that
// runs thousands of times a second.
func BenchmarkHandleEval(b *testing.B) {
	path := filepath.Join(b.TempDir(), "endpoint_aliases.json")
	if err := os.WriteFile(path, []byte(
		`{"adapters":{"dxfeed":{"defaultEndpoint":"price","endpoints":{"price":{"aliases":["stock"]}}}}}`,
	), 0o644); err != nil {
		b.Fatal(err)
	}
	if err := helpers.InitAliasIndex("dxfeed", path); err != nil {
		b.Fatal(err)
	}

	c := cache.New(cache.Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()
	srv := New(Config{Addr: ":0", Cache: c, Logger: slog.Default()})

	cmd := makeCmd("EVAL", "script", "1",
		`dxfeed-data-streams-DXFEED-price-rest-{"base":"bil:uslf24"}`,
		`{"data":{"result":91.59},"timestamps":{"providerDataReceivedUnixMs":1790278106626},"meta":{"adapterName":"DXFEED","transportName":"rest","metrics":{"feedId":"{\"base\":\"bil:uslf24\"}"}},"result":91.59}`)
	conn := newMockConn()

	b.Run("memoized", func(b *testing.B) {
		b.ReportAllocs()
		for b.Loop() {
			conn.writes = conn.writes[:0]
			srv.handleCommand(conn, cmd)
		}
	})

	// Evicting the single memo entry each iteration reproduces the pre-memo
	// path, where every observation re-derived its transformed key. The delete
	// on a one-entry map is negligible against the derivation it forces.
	b.Run("rederived", func(b *testing.B) {
		b.ReportAllocs()
		for b.Loop() {
			srv.transformedKeysMu.Lock()
			clear(srv.transformedKeys)
			srv.transformedKeysMu.Unlock()
			conn.writes = conn.writes[:0]
			srv.handleCommand(conn, cmd)
		}
	})
}

// BenchmarkTransformedKey isolates the work the memo removes from the
// per-observation path: "derive" is what ran on every observation before,
// "memoized" is what runs now.
func BenchmarkTransformedKey(b *testing.B) {
	path := filepath.Join(b.TempDir(), "endpoint_aliases.json")
	if err := os.WriteFile(path, []byte(
		`{"adapters":{"dxfeed":{"defaultEndpoint":"price","endpoints":{"price":{"aliases":["stock"]}}}}}`,
	), 0o644); err != nil {
		b.Fatal(err)
	}
	if err := helpers.InitAliasIndex("dxfeed", path); err != nil {
		b.Fatal(err)
	}

	const adapterKey = `dxfeed-data-streams-DXFEED-price-rest-{"base":"bil:uslf24"}`
	meta := json.RawMessage(`{"adapterName":"DXFEED","transportName":"rest","metrics":{"feedId":"{\"base\":\"bil:uslf24\"}"}}`)

	srv := New(Config{Addr: ":0", Logger: slog.Default()})

	b.Run("derive", func(b *testing.B) {
		b.ReportAllocs()
		for b.Loop() {
			if _, err := helpers.TransformedKeyFromAdapterKey(adapterKey, transportName(meta)); err != nil {
				b.Fatal(err)
			}
		}
	})

	b.Run("memoized", func(b *testing.B) {
		if _, err := srv.transformedKeyFor(adapterKey, meta); err != nil {
			b.Fatal(err)
		}
		b.ReportAllocs()
		for b.Loop() {
			if _, err := srv.transformedKeyFor(adapterKey, meta); err != nil {
				b.Fatal(err)
			}
		}
	})
}

// A response with no meta.transportName yields an unqualified key — the same
// key the feedId path derives from the same absent field, so the two still bind.
func TestHandleCommand_Eval_MissingTransportNameFallsBackToUnqualifiedKey(t *testing.T) {
	initDxfeedAliases(t)

	c := cache.New(cache.Config{TTL: time.Minute, CleanupInterval: time.Hour})
	defer c.Stop()

	pub := transmitter.NewPublisher()
	srv := New(Config{Addr: ":0", Cache: c, Publisher: pub, Logger: slog.Default()})

	const rawKey = "endpoint=price:from=bil:uslf24:to=usd"
	hash := [32]byte{2}
	c.SetNew(rawKey, nil, hash)
	c.SetTransformedKey(rawKey, "base=bil:uslf24:endpoint=price")

	ch := make(chan transmitter.Event, 1)
	pub.Subscribe(hash, ch)

	srv.handleCommand(newMockConn(), makeCmd("EVAL", "script", "1",
		`dxfeed-data-streams-DXFEED-price-rest-{"base":"bil:uslf24"}`,
		`{"data":{"result":91.59},"meta":{"adapterName":"DXFEED"},"result":91.59}`))

	select {
	case e := <-ch:
		require.Equal(t, hash, e.PayloadHash)
	case <-time.After(time.Second):
		t.Fatal("subscriber did not receive the observation")
	}
}
