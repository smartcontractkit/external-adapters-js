package main

import (
	"os"
	"testing"
	"time"
)

func TestLoadConfig_Defaults(t *testing.T) {
	// Clear environment variables
	os.Clearenv()

	config := LoadConfig()

	if config.Port != 8080 {
		t.Errorf("Expected default port 8080, got %d", config.Port)
	}

	if config.DownstreamURL != "http://localhost:8081" {
		t.Errorf("Expected default downstream URL http://localhost:8081, got %s", config.DownstreamURL)
	}

	if config.CacheTTL != 30*time.Second {
		t.Errorf("Expected default cache TTL 30s, got %v", config.CacheTTL)
	}

	if config.Cache404 != false {
		t.Errorf("Expected default Cache404 false, got %v", config.Cache404)
	}
}

func TestLoadConfig_FromEnvironment(t *testing.T) {
	// Set environment variables
	os.Setenv("PORT", "9090")
	os.Setenv("DOWNSTREAM_URL", "http://example.com")
	os.Setenv("CACHE_TTL", "2m")
	os.Setenv("CACHE_404", "true")
	os.Setenv("CACHE_KEY_HEADERS", "Authorization,X-API-Key")
	defer os.Clearenv()

	config := LoadConfig()

	if config.Port != 9090 {
		t.Errorf("Expected port 9090, got %d", config.Port)
	}

	if config.DownstreamURL != "http://example.com" {
		t.Errorf("Expected downstream URL http://example.com, got %s", config.DownstreamURL)
	}

	if config.CacheTTL != 2*time.Minute {
		t.Errorf("Expected cache TTL 2m, got %v", config.CacheTTL)
	}

	if config.Cache404 != true {
		t.Errorf("Expected Cache404 true, got %v", config.Cache404)
	}

	if len(config.CacheKeyHeaders) != 2 {
		t.Errorf("Expected 2 cache key headers, got %d", len(config.CacheKeyHeaders))
	}

	if config.CacheKeyHeaders[0] != "Authorization" {
		t.Errorf("Expected first header to be Authorization, got %s", config.CacheKeyHeaders[0])
	}
}

func TestLoadConfig_InvalidValues(t *testing.T) {
	os.Clearenv()

	// Set invalid values
	os.Setenv("PORT", "not-a-number")
	os.Setenv("CACHE_TTL", "invalid-duration")
	os.Setenv("CACHE_404", "not-a-bool")
	defer os.Clearenv()

	config := LoadConfig()

	// Should fall back to defaults
	if config.Port != 8080 {
		t.Errorf("Expected default port 8080 for invalid value, got %d", config.Port)
	}

	if config.CacheTTL != 30*time.Second {
		t.Errorf("Expected default cache TTL for invalid value, got %v", config.CacheTTL)
	}

	if config.Cache404 != false {
		t.Errorf("Expected default Cache404 for invalid value, got %v", config.Cache404)
	}
}
