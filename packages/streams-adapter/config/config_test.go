package config

import (
	"testing"
)

// helper to set env vars and return a cleanup function
func setEnvs(t *testing.T, envs map[string]string) {
	t.Helper()
	for k, v := range envs {
		t.Setenv(k, v)
	}
}

func TestLoad_Defaults(t *testing.T) {
	// Unset all env vars that Load reads so defaults apply
	for _, key := range []string{
		"PACKAGE_NAME", "HTTP_PORT", "EA_PORT", "EA_INTERNAL_HOST",
		"REDCON_PORT", "GO_METRICS_PORT",
		"CACHE_TTL_MINUTES", "CACHE_CLEANUP_INTERVAL", "LOG_LEVEL",
	} {
		t.Setenv(key, "")
	}

	cfg := Load()

	if cfg.HTTPPort != "8080" {
		t.Errorf("HTTPPort = %q, want %q", cfg.HTTPPort, "8080")
	}
	if cfg.EAPort != "8070" {
		t.Errorf("EAPort = %q, want %q", cfg.EAPort, "8070")
	}
	if cfg.EAHost != "localhost" {
		t.Errorf("EAHost = %q, want %q", cfg.EAHost, "localhost")
	}
	if cfg.RedconPort != "6379" {
		t.Errorf("RedconPort = %q, want %q", cfg.RedconPort, "6379")
	}
	if cfg.GoMetricsPort != "9080" {
		t.Errorf("GoMetricsPort = %q, want %q", cfg.GoMetricsPort, "9080")
	}
	if cfg.CacheTTLMinutes != 5 {
		t.Errorf("CacheTTLMinutes = %d, want %d", cfg.CacheTTLMinutes, 5)
	}
	if cfg.CacheCleanupInterval != 1 {
		t.Errorf("CacheCleanupInterval = %d, want %d", cfg.CacheCleanupInterval, 1)
	}
	if cfg.LogLevel != "info" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "info")
	}
	if cfg.AdapterName != "" {
		t.Errorf("AdapterName = %q, want %q", cfg.AdapterName, "")
	}
}

func TestLoad_CustomEnvVars(t *testing.T) {
	setEnvs(t, map[string]string{
		"PACKAGE_NAME":           "@chainlink/tiingo-adapter",
		"HTTP_PORT":              "9090",
		"EA_PORT":                "7070",
		"EA_INTERNAL_HOST":       "0.0.0.0",
		"REDCON_PORT":            "6380",
		"GO_METRICS_PORT":        "9090",
		"CACHE_TTL_MINUTES":      "10",
		"CACHE_CLEANUP_INTERVAL": "3",
		"LOG_LEVEL":              "debug",
	})

	cfg := Load()

	if cfg.HTTPPort != "9090" {
		t.Errorf("HTTPPort = %q, want %q", cfg.HTTPPort, "9090")
	}
	if cfg.EAPort != "7070" {
		t.Errorf("EAPort = %q, want %q", cfg.EAPort, "7070")
	}
	if cfg.EAHost != "0.0.0.0" {
		t.Errorf("EAHost = %q, want %q", cfg.EAHost, "0.0.0.0")
	}
	if cfg.RedconPort != "6380" {
		t.Errorf("RedconPort = %q, want %q", cfg.RedconPort, "6380")
	}
	if cfg.GoMetricsPort != "9090" {
		t.Errorf("GoMetricsPort = %q, want %q", cfg.GoMetricsPort, "9090")
	}
	if cfg.CacheTTLMinutes != 10 {
		t.Errorf("CacheTTLMinutes = %d, want %d", cfg.CacheTTLMinutes, 10)
	}
	if cfg.CacheCleanupInterval != 3 {
		t.Errorf("CacheCleanupInterval = %d, want %d", cfg.CacheCleanupInterval, 3)
	}
	if cfg.LogLevel != "debug" {
		t.Errorf("LogLevel = %q, want %q", cfg.LogLevel, "debug")
	}
	if cfg.AdapterName != "tiingo" {
		t.Errorf("AdapterName = %q, want %q", cfg.AdapterName, "tiingo")
	}
}
