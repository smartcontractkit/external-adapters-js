package redcon

import (
	"log/slog"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	cache "streams-adapter/cache"
	types "streams-adapter/common"
	helpers "streams-adapter/helpers"
	"streams-adapter/transmitter"

	"github.com/goccy/go-json"
	"github.com/tidwall/redcon"
)

type sortedSetMember struct {
	member string
	score  float64
}

// transformedKeyCacheMax bounds the transformed-key memo. Distinct adapter keys
// track the subscribed asset set, so this sits far above any real workload; it
// exists only so a long-lived process cannot accumulate entries for assets that
// have since been unsubscribed. Overflow drops the memo and repopulates lazily.
const transformedKeyCacheMax = 50_000

// RedconServer represents a Redis-compatible server
type RedconServer struct {
	addr       string
	cache      *cache.Cache
	publisher  *transmitter.Publisher
	logger     *slog.Logger
	mu         sync.RWMutex
	sortedSets map[string]map[string]float64 // key -> (member -> score)

	transformedKeysMu sync.RWMutex
	transformedKeys   map[string]string // JS adapter cache key -> transformed key
}

// Config holds the Redis server configuration
type Config struct {
	Addr      string
	Cache     *cache.Cache
	Publisher *transmitter.Publisher
	Logger    *slog.Logger
}

// New creates a new Redis server instance
func New(cfg Config) *RedconServer {
	return &RedconServer{
		addr:            cfg.Addr,
		cache:           cfg.Cache,
		publisher:       cfg.Publisher,
		logger:          cfg.Logger,
		sortedSets:      make(map[string]map[string]float64),
		transformedKeys: make(map[string]string),
	}
}

// Start starts the Redis server
func (s *RedconServer) Start() error {
	return redcon.ListenAndServe(s.addr,
		s.handleCommand,
		s.handleConnect,
		s.handleDisconnect,
	)
}

// handleCommand processes incoming Redis commands
func (s *RedconServer) handleCommand(conn redcon.Conn, cmd redcon.Command) {
	if len(cmd.Args) == 0 {
		conn.WriteError("ERR empty command")
		return
	}

	cmdName := strings.ToLower(string(cmd.Args[0]))

	switch cmdName {
	case "info":
		s.handleInfo(conn)
	case "ping":
		s.handlePing(conn)
	case "quit":
		s.handleQuit(conn)
	case "client":
		s.handleClient(conn, cmd)
	case "multi":
		s.handleMulti(conn)
	case "exec":
		s.handleExec(conn)
	case "get":
		s.handleGet(conn)
	case "pexpire":
		s.handlePExpire(conn)
	case "eval", "evalsha":
		s.handleEval(conn, cmd)
	case "zadd":
		s.handleZAdd(conn, cmd)
	case "zremrangebyscore":
		s.handleZRemRangeByScore(conn, cmd)
	case "zrange":
		s.handleZRange(conn, cmd)
	case "auth":
		s.handleAuth(conn, cmd)
	default:
		s.logger.Warn("Unknown command: '%s' with args: %v", cmdName, cmd.Args)
		conn.WriteError("ERR unknown command '" + cmdName + "'")
	}
}

// handleConnect is called when a new connection is established
func (s *RedconServer) handleConnect(conn redcon.Conn) bool {
	return true
}

// handleDisconnect is called when a connection is closed
func (s *RedconServer) handleDisconnect(conn redcon.Conn, err error) {
	if err != nil {
		s.logger.Error("connection error", "error", err)
	}
}

// handleInfo handles the INFO command
func (s *RedconServer) handleInfo(conn redcon.Conn) {
	infoResponse := "# Server\nredis_version:7.0.0\nredis_mode:standalone\n\n"
	conn.WriteBulkString(infoResponse)
}

// handlePing handles the PING command
func (s *RedconServer) handlePing(conn redcon.Conn) {
	conn.WriteString("PONG")
}

// Simply accept any authentication attempt
func (s *RedconServer) handleAuth(conn redcon.Conn, _ redcon.Command) {
	conn.WriteString("OK")
}

// handleQuit handles the QUIT command
func (s *RedconServer) handleQuit(conn redcon.Conn) {
	conn.WriteString("OK")
	conn.Close()
}

// handleClient handles the CLIENT command
func (s *RedconServer) handleClient(conn redcon.Conn, cmd redcon.Command) {
	if len(cmd.Args) < 2 {
		conn.WriteError("ERR wrong number of arguments for 'client' command")
		return
	}
	subCmd := strings.ToLower(string(cmd.Args[1]))
	switch subCmd {
	case "setinfo", "setname":
		// Just acknowledge, we don't actually store this
		conn.WriteString("OK")
	case "getname":
		conn.WriteNull()
	default:
		conn.WriteError("ERR unknown CLIENT subcommand '" + subCmd + "'")
	}
}

// handleMulti handles the MULTI command
func (s *RedconServer) handleMulti(conn redcon.Conn) {
	conn.WriteString("OK")
}

// handleExec handles the EXEC command
func (s *RedconServer) handleExec(conn redcon.Conn) {
	conn.WriteArray(0)
}

// handleGet handles the GET command
func (s *RedconServer) handleGet(conn redcon.Conn) {
	conn.WriteNull()
}

// handleEval handles the EVAL and EVALSHA commands
func (s *RedconServer) handleEval(conn redcon.Conn, cmd redcon.Command) {
	if len(cmd.Args) < 5 {
		conn.WriteError("ERR wrong number of arguments for '" + strings.ToLower(string(cmd.Args[0])) + "' command")
		return
	}

	key := string(cmd.Args[3])
	value := cmd.Args[4]

	// The framework only writes adapter responses via EVAL with a JSON object
	// payload (JSON.stringify(AdapterResponse)). Any other EVAL the framework
	// issues — most notably Redlock lock acquire/release/extend, whose ARGV[1]
	// is a random hex identifier — is not a response cache write and must be
	// ignored silently rather than warned about.
	if len(value) == 0 || value[0] != '{' {
		conn.WriteInt(1)
		return
	}

	// Parse JSON value. This happens before the transformed key is derived
	// because the key is qualified by meta.transportName, which only the
	// response body carries.
	var rawJSON map[string]json.RawMessage
	if err := json.Unmarshal(value, &rawJSON); err != nil {
		s.logger.Warn("unable to parse JSON", "error", err, "key", key)
		conn.WriteInt(1)
		return
	}

	transformedKey, err := s.transformedKeyFor(key, rawJSON["meta"])
	if err != nil {
		s.logger.Debug("unable to compute transformed cache key from adapter key", "key", key, "error", err)
		conn.WriteInt(1)
		return
	}

	// Create Observation from JSON
	obs := &types.Observation{
		Success:    true,
		StatusCode: http.StatusOK,
	}

	// Check for errorMessage field
	if errMsg, hasError := rawJSON["errorMessage"]; hasError {
		var errorStr string
		if err := json.Unmarshal(errMsg, &errorStr); err == nil {
			obs.Error = errorStr
			obs.Success = false
		}
	}

	// Extract data field
	if data, hasData := rawJSON["data"]; hasData {
		obs.Data = append(json.RawMessage(nil), data...)
	}

	// Extract timestamps field
	if timestamps, hasTimestamps := rawJSON["timestamps"]; hasTimestamps {
		obs.Timestamps = append(json.RawMessage(nil), timestamps...)
	}

	// Extract meta field
	if meta, hasMeta := rawJSON["meta"]; hasMeta {
		obs.Meta = append(json.RawMessage(nil), meta...)
	}

	// Extract result field
	if result, hasResult := rawJSON["result"]; hasResult {
		obs.Result = append(json.RawMessage(nil), result...)
	}
	ts := time.Now()
	s.cache.SetObservation(transformedKey, obs, ts, key)
	if s.publisher != nil {
		if rawKeys, ok := s.cache.RawKeysByTransformed(transformedKey); ok {
			for _, rawKey := range rawKeys {
				if payloadHashes, ok := s.cache.PayloadHashesByRawKey(rawKey); ok {
					for _, payloadHash := range payloadHashes {
						s.publisher.Publish(payloadHash, obs, ts)
					}
				}
			}
		}
	}
	conn.WriteInt(1)
}

// transformedKeyFor maps a JS adapter cache key to its transformed key,
// deriving it at most once per adapter key.
//
// handleEval runs on every observation — thousands per second on a busy adapter
// — but the derivation is pure and its inputs are fixed per adapter key: the
// framework builds that key from the transport it routed to, so a given key is
// only ever written by one transport and always yields the same transformed
// key. Memoizing keeps the params-blob unmarshal, canonicalization, sort and
// join off the per-observation path, along with the meta.transportName lookup —
// which is why meta stays raw here and is parsed only on a miss.
//
// Derivation failures are not memoized; they are malformed keys, logged by the
// caller and rare.
func (s *RedconServer) transformedKeyFor(key string, meta json.RawMessage) (string, error) {
	s.transformedKeysMu.RLock()
	transformed, ok := s.transformedKeys[key]
	s.transformedKeysMu.RUnlock()
	if ok {
		return transformed, nil
	}

	transformed, err := helpers.TransformedKeyFromAdapterKey(key, transportName(meta))
	if err != nil {
		return "", err
	}

	s.transformedKeysMu.Lock()
	if len(s.transformedKeys) >= transformedKeyCacheMax {
		clear(s.transformedKeys)
	}
	s.transformedKeys[key] = transformed
	s.transformedKeysMu.Unlock()
	return transformed, nil
}

// transportName reads meta.transportName off an adapter response: the transport
// the v3 framework actually routed the request to. It returns "" when the field
// is absent, which yields a transport-blind transformed key — the same thing
// the feedId path does with the same absent field, so the two stay in
// agreement. Only reached on a transformedKeyFor miss.
func transportName(meta json.RawMessage) string {
	if len(meta) == 0 {
		return ""
	}
	var parsed struct {
		TransportName string `json:"transportName"`
	}
	if err := json.Unmarshal(meta, &parsed); err != nil {
		return ""
	}
	return parsed.TransportName
}

// handleZAdd handles the ZADD command
func (s *RedconServer) handleZAdd(conn redcon.Conn, cmd redcon.Command) {
	// ZADD key score member
	if len(cmd.Args) < 4 {
		conn.WriteError("ERR wrong number of arguments for '" + string(cmd.Args[0]) + "' command")
		return
	}
	key := string(cmd.Args[1])
	scoreStr := string(cmd.Args[2])
	member := string(cmd.Args[3])

	score, err := strconv.ParseFloat(scoreStr, 64)
	if err != nil {
		conn.WriteError("ERR value is not a valid float")
		return
	}

	s.mu.Lock()

	// Get or create the sorted set
	zset, exists := s.sortedSets[key]
	if !exists {
		zset = make(map[string]float64)
		s.sortedSets[key] = zset
	}

	addedCount := 0
	if _, exists := zset[member]; !exists {
		addedCount = 1
	}
	zset[member] = score

	s.mu.Unlock()

	conn.WriteInt(addedCount)
}

// handleZRemRangeByScore handles the ZREMRANGEBYSCORE command
func (s *RedconServer) handleZRemRangeByScore(conn redcon.Conn, cmd redcon.Command) {
	if len(cmd.Args) != 4 {
		conn.WriteError("ERR wrong number of arguments for '" + string(cmd.Args[0]) + "' command")
		return
	}
	key := string(cmd.Args[1])
	minStr := string(cmd.Args[2])
	maxStr := string(cmd.Args[3])

	// Parse min and max scores
	min, err := strconv.ParseFloat(minStr, 64)
	if err != nil {
		conn.WriteError("ERR min value is not a valid float")
		return
	}
	max, err := strconv.ParseFloat(maxStr, 64)
	if err != nil {
		conn.WriteError("ERR max value is not a valid float")
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	// Get the sorted set
	zset, exists := s.sortedSets[key]
	if !exists {
		conn.WriteInt(0)
		return
	}

	// Count and remove members within the score range
	removedCount := 0
	for member, score := range zset {
		if score >= min && score <= max {
			delete(zset, member)
			removedCount++
		}
	}

	// If the sorted set is now empty, remove it
	if len(zset) == 0 {
		delete(s.sortedSets, key)
	}

	conn.WriteInt(removedCount)
}

// handleZRange handles the ZRANGE command
func (s *RedconServer) handleZRange(conn redcon.Conn, cmd redcon.Command) {
	// ZRANGE key 0 -1 (always returns all members)
	if len(cmd.Args) < 2 {
		conn.WriteError("ERR wrong number of arguments for '" + string(cmd.Args[0]) + "' command")
		return
	}
	key := string(cmd.Args[1])

	s.mu.RLock()
	zset, exists := s.sortedSets[key]
	s.mu.RUnlock()

	if !exists {
		conn.WriteArray(0)
		return
	}

	// Convert map to slice and sort by score
	members := make([]sortedSetMember, 0, len(zset))
	for member, score := range zset {
		members = append(members, sortedSetMember{member: member, score: score})
	}
	sort.Slice(members, func(i, j int) bool {
		if members[i].score == members[j].score {
			return members[i].member < members[j].member
		}
		return members[i].score < members[j].score
	})

	// Write response (all members)
	conn.WriteArray(len(members))
	for _, m := range members {
		conn.WriteBulkString(m.member)
	}
}

// handlePExpire handles the PEXPIRE command
func (s *RedconServer) handlePExpire(conn redcon.Conn) {
	conn.WriteInt(1)
}
