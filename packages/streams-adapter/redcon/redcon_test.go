package redcon

import (
	"fmt"
	"log/slog"
	"net"
	"strings"
	"testing"
	"time"

	cache "streams-adapter/cache"

	"github.com/stretchr/testify/require"
	"github.com/tidwall/redcon"
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
		t.Errorf("error should mention wrong number of arguments, got: %s", errMsg)
	}
}
