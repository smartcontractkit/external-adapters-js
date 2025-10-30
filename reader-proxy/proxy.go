package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"sync/atomic"
	"time"

	"golang.org/x/sync/singleflight"
)

// Proxy handles request coalescing and caching
type Proxy struct {
	config        *Config
	cache         *Cache
	client        *http.Client
	requestGroup  singleflight.Group
	totalRequests uint64
	cacheHits     uint64
	coalesced     uint64
}

// NewProxy creates a new proxy instance
func NewProxy(config *Config, cache *Cache) *Proxy {
	return &Proxy{
		config: config,
		cache:  cache,
		client: &http.Client{
			Timeout: config.DownstreamTimeout,
		},
	}
}

// HandleRequest processes incoming HTTP requests with caching and coalescing
func (p *Proxy) HandleRequest(w http.ResponseWriter, r *http.Request) {
	atomic.AddUint64(&p.totalRequests, 1)

	// Generate cache key based on method, path, query, and optionally body
	cacheKey := p.generateCacheKey(r)

	// Check cache first
	if entry, found := p.cache.Get(cacheKey); found {
		atomic.AddUint64(&p.cacheHits, 1)
		p.writeCachedResponse(w, entry)
		log.Printf("Cache HIT: %s %s", r.Method, r.URL.Path)
		return
	}

	// Use singleflight to coalesce concurrent requests
	result, err, shared := p.requestGroup.Do(cacheKey, func() (interface{}, error) {
		return p.fetchFromDownstream(r, cacheKey)
	})

	if shared {
		atomic.AddUint64(&p.coalesced, 1)
		log.Printf("Request COALESCED: %s %s", r.Method, r.URL.Path)
	}

	if err != nil {
		log.Printf("Error fetching from downstream: %v", err)
		http.Error(w, "Failed to fetch from downstream", http.StatusBadGateway)
		return
	}

	entry := result.(*CacheEntry)
	p.writeCachedResponse(w, entry)
}

// generateCacheKey creates a unique key for the request
func (p *Proxy) generateCacheKey(r *http.Request) string {
	// Read body if present (for POST/PUT requests)
	var bodyBytes []byte
	if r.Body != nil {
		bodyBytes, _ = io.ReadAll(r.Body)
		// Restore body for downstream request
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	}

	// Create hash of method + URL + query + body
	h := sha256.New()
	h.Write([]byte(r.Method))
	h.Write([]byte(r.URL.Path))
	h.Write([]byte(r.URL.RawQuery))
	if len(bodyBytes) > 0 {
		h.Write(bodyBytes)
	}

	// Optionally include certain headers in cache key
	for _, header := range p.config.CacheKeyHeaders {
		if value := r.Header.Get(header); value != "" {
			h.Write([]byte(header + ":" + value))
		}
	}

	return hex.EncodeToString(h.Sum(nil))
}

// fetchFromDownstream makes the actual request to the downstream service
func (p *Proxy) fetchFromDownstream(r *http.Request, cacheKey string) (*CacheEntry, error) {
	// Build downstream URL
	downstreamURL := p.config.DownstreamURL + r.URL.Path
	if r.URL.RawQuery != "" {
		downstreamURL += "?" + r.URL.RawQuery
	}

	// Read request body if present
	var bodyBytes []byte
	if r.Body != nil {
		bodyBytes, _ = io.ReadAll(r.Body)
		r.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))
	}

	// Create downstream request
	req, err := http.NewRequest(r.Method, downstreamURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Copy relevant headers
	for key, values := range r.Header {
		// Skip hop-by-hop headers
		if isHopByHopHeader(key) {
			continue
		}
		for _, value := range values {
			req.Header.Add(key, value)
		}
	}

	// Make the request
	log.Printf("Fetching from downstream: %s %s", req.Method, downstreamURL)
	resp, err := p.client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("downstream request failed: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Extract relevant headers to cache
	headers := make(map[string]string)
	for key, values := range resp.Header {
		if !isHopByHopHeader(key) && len(values) > 0 {
			headers[key] = values[0]
		}
	}

	// Create cache entry
	entry := &CacheEntry{
		Value:      respBody,
		StatusCode: resp.StatusCode,
		Headers:    headers,
		ExpiresAt:  time.Now().Add(p.cache.ttl),
	}

	// Cache the response only if it's a successful response (or if configured otherwise)
	if p.shouldCache(resp.StatusCode) {
		p.cache.Set(cacheKey, respBody, resp.StatusCode, headers)
		log.Printf("Cached response: %s %s (status: %d)", r.Method, r.URL.Path, resp.StatusCode)
	}

	return entry, nil
}

// shouldCache determines if a response should be cached based on status code
func (p *Proxy) shouldCache(statusCode int) bool {
	// Cache successful responses
	if statusCode >= 200 && statusCode < 300 {
		return true
	}

	// Optionally cache 404s to prevent repeated lookups
	if statusCode == 404 && p.config.Cache404 {
		return true
	}

	return false
}

// writeCachedResponse writes a cached entry to the response writer
func (p *Proxy) writeCachedResponse(w http.ResponseWriter, entry *CacheEntry) {
	// Write headers
	for key, value := range entry.Headers {
		w.Header().Set(key, value)
	}

	// Add cache header
	w.Header().Set("X-Cache", "HIT")

	// Write status code
	w.WriteHeader(entry.StatusCode)

	// Write body
	w.Write(entry.Value)
}

// HandleMetrics returns proxy metrics
func (p *Proxy) HandleMetrics(w http.ResponseWriter, r *http.Request) {
	hits, misses, cacheSize := p.cache.GetMetrics()
	totalReqs := atomic.LoadUint64(&p.totalRequests)
	coalesced := atomic.LoadUint64(&p.coalesced)

	hitRate := 0.0
	if totalReqs > 0 {
		hitRate = float64(hits) / float64(totalReqs) * 100
	}

	w.Header().Set("Content-Type", "application/json")
	fmt.Fprintf(w, `{
  "total_requests": %d,
  "cache_hits": %d,
  "cache_misses": %d,
  "cache_hit_rate": %.2f,
  "cache_size": %d,
  "coalesced_requests": %d
}`, totalReqs, hits, misses, hitRate, cacheSize, coalesced)
}

// isHopByHopHeader checks if a header should not be forwarded
func isHopByHopHeader(header string) bool {
	hopByHopHeaders := []string{
		"Connection",
		"Keep-Alive",
		"Proxy-Authenticate",
		"Proxy-Authorization",
		"Te",
		"Trailers",
		"Transfer-Encoding",
		"Upgrade",
	}

	headerLower := strings.ToLower(header)
	for _, h := range hopByHopHeaders {
		if strings.ToLower(h) == headerLower {
			return true
		}
	}
	return false
}
