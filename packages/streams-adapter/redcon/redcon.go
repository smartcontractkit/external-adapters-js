package redcon

import (
	"log/slog"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	cache "streams-adapter/cache"
	types "streams-adapter/common"
	helpers "streams-adapter/helpers"

	"github.com/goccy/go-json"
	"github.com/tidwall/redcon"
)

// SortedSetMember represents a member in a sorted set with its score
type SortedSetMember struct {
	member string
	score  float64
}

// itemWithExpiry represents a value with an expiration time
type itemWithExpiry struct {
	value  []byte
	expiry time.Time
}

// Server represents a Redis-compatible server
type RedconServer struct {
	addr         string
	cache        *cache.Cache
	logger       *slog.Logger
	mu           sync.RWMutex
	items        map[string]itemWithExpiry
	sortedSets   map[string]map[string]float64 // key -> (member -> score)
	commandStats map[string]int64              // command -> call count
	server       *redcon.Server
}

// Config holds the Redis server configuration
type Config struct {
	Addr   string
	Cache  *cache.Cache
	Logger *slog.Logger
}

// New creates a new Redis server instance
func New(cfg Config) *RedconServer {
	rs := &RedconServer{
		addr:         cfg.Addr,
		cache:        cfg.Cache,
		logger:       cfg.Logger,
		items:        make(map[string]itemWithExpiry),
		sortedSets:   make(map[string]map[string]float64),
		commandStats: make(map[string]int64),
	}

	// Start background goroutine to clean up expired keys
	go rs.cleanupExpiredKeys()

	return rs
}

// Start starts the Redis server
func (s *RedconServer) Start() error {
	s.logger.Info("Starting Redis-compatible server", "addr", s.addr)
	return redcon.ListenAndServe(s.addr,
		s.handleCommand,
		s.handleConnect,
		s.handleDisconnect,
	)
}

// Stop stops the Redis server
func (s *RedconServer) Stop() error {
	if s.server != nil {
		return s.server.Close()
	}
	return nil
}

// handleCommand processes incoming Redis commands
func (s *RedconServer) handleCommand(conn redcon.Conn, cmd redcon.Command) {
	cmdName := strings.ToLower(string(cmd.Args[0]))

	// Track command statistics
	s.mu.Lock()
	s.commandStats[cmdName]++
	s.mu.Unlock()

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
		s.handleGet(conn, cmd)
	case "pexpire":
		s.handlePExpire(conn, cmd)
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
	s.logger.Info("Redis client connected", "remote_addr", conn.RemoteAddr())
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
	s.mu.RLock()
	defer s.mu.RUnlock()

	infoResponse := "# Server\nredis_version:7.0.0\nredis_mode:standalone\n\n"

	// Memory stats
	infoResponse += "# Memory\n"
	infoResponse += "keys_count:" + strconv.Itoa(len(s.items)) + "\n"
	infoResponse += "sorted_sets_count:" + strconv.Itoa(len(s.sortedSets)) + "\n\n"

	// Command stats
	infoResponse += "# Stats\n"

	// Calculate total first
	var totalCommands int64
	for _, count := range s.commandStats {
		totalCommands += count
	}
	infoResponse += "total_commands_processed:" + strconv.FormatInt(totalCommands, 10) + "\n\n"

	// Sort commands by name for consistent output
	infoResponse += "# Commandstats\n"
	cmdNames := make([]string, 0, len(s.commandStats))
	for cmd := range s.commandStats {
		cmdNames = append(cmdNames, cmd)
	}
	sort.Strings(cmdNames)

	for _, cmd := range cmdNames {
		count := s.commandStats[cmd]
		infoResponse += cmd + ":calls=" + strconv.FormatInt(count, 10) + "\n"
	}

	conn.WriteBulkString(infoResponse)
}

// handlePing handles the PING command
func (s *RedconServer) handlePing(conn redcon.Conn) {
	conn.WriteString("PONG")
}

// handleAuth handles the AUTH command
// This is a no-op since we don't require authentication for local connections
// But we need to respond with OK to satisfy Redis clients that send AUTH
func (s *RedconServer) handleAuth(conn redcon.Conn, cmd redcon.Command) {
	// Simply accept any authentication attempt
	// In a production environment, you might want to validate credentials
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
func (s *RedconServer) handleGet(conn redcon.Conn, cmd redcon.Command) {
	if len(cmd.Args) != 2 {
		conn.WriteError("ERR wrong number of arguments for '" + string(cmd.Args[0]) + "' command")
		return
	}
	key := string(cmd.Args[1])
	s.mu.RLock()
	item, ok := s.items[key]
	s.mu.RUnlock()

	if !ok {
		s.logger.Debug("GET: key not found", "key", key)
		conn.WriteNull()
		return
	}

	// Check if key has expired
	if !item.expiry.IsZero() && time.Now().After(item.expiry) {
		// Key has expired, remove it
		s.mu.Lock()
		delete(s.items, key)
		s.mu.Unlock()
		s.logger.Debug("GET: key expired", "key", key)
		conn.WriteNull()
		return
	}

	s.logger.Debug("GET: found value", "key", key)
	conn.WriteBulk(item.value)
}

// handleEval handles the EVAL and EVALSHA commands
func (s *RedconServer) handleEval(conn redcon.Conn, cmd redcon.Command) {
	key := string(cmd.Args[3])

	// Extract request parameters from the key
	params, ok := helpers.RequestParamsFromKey(key)
	if !ok {
		s.logger.Debug("unable to parse request params from key", "key", key)
		conn.WriteInt(1)
		return
	}
	// Parse JSON value
	var rawJSON map[string]json.RawMessage
	if err := json.Unmarshal(cmd.Args[4], &rawJSON); err != nil {
		s.logger.Warn("unable to parse JSON", "error", err)
		conn.WriteInt(1)
		return
	}

	// Create Observation from JSON
	obs := &types.Observation{
		Success: true,
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
		obs.Data = data
	}

	s.cache.Set(params, obs, time.Now())
	conn.WriteInt(1)
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
	defer s.mu.Unlock()

	// Get or create the sorted set
	zset, exists := s.sortedSets[key]
	if !exists {
		zset = make(map[string]float64)
		s.sortedSets[key] = zset
	}

	// Check if member is new
	addedCount := 0
	if _, exists := zset[member]; !exists {
		addedCount = 1
	}
	zset[member] = score

	s.logger.Debug("zadd", "key", key, "score", scoreStr, "member", member)
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
	members := make([]SortedSetMember, 0, len(zset))
	for member, score := range zset {
		members = append(members, SortedSetMember{member: member, score: score})
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

// handlePExpire handles the PEXPIRE command (milliseconds)
func (s *RedconServer) handlePExpire(conn redcon.Conn, cmd redcon.Command) {
	if len(cmd.Args) != 3 {
		conn.WriteError("ERR wrong number of arguments for 'pexpire' command")
		return
	}
	key := string(cmd.Args[1])
	milliseconds, err := strconv.ParseInt(string(cmd.Args[2]), 10, 64)
	if err != nil {
		conn.WriteError("ERR value is not an integer or out of range")
		return
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	item, ok := s.items[key]
	if !ok {
		conn.WriteInt(0) // Key doesn't exist
		return
	}

	item.expiry = time.Now().Add(time.Duration(milliseconds) * time.Millisecond)
	s.items[key] = item
	conn.WriteInt(1) // Expiration was set
}

// cleanupExpiredKeys runs in the background to periodically remove expired keys
func (s *RedconServer) cleanupExpiredKeys() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		now := time.Now()
		s.mu.Lock()
		for key, item := range s.items {
			if !item.expiry.IsZero() && now.After(item.expiry) {
				delete(s.items, key)
			}
		}
		s.mu.Unlock()
	}
}
