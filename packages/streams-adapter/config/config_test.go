package config

import (
	"testing"

	"github.com/stretchr/testify/require"
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
		"REDCON_PORT", "METRICS_PORT",
		"CACHE_TTL_MINUTES", "CACHE_CLEANUP_INTERVAL", "LOG_LEVEL",
	} {
		t.Setenv(key, "")
	}

	cfg := Load()

	require.Equal(t, "8080", cfg.HTTPPort)
	require.Equal(t, "8070", cfg.EAPort)
	require.Equal(t, "localhost", cfg.EAHost)
	require.Equal(t, "6379", cfg.RedconPort)
	require.Equal(t, "9080", cfg.GoMetricsPort)
	require.Equal(t, uint(5), cfg.CacheTTLMinutes)
	require.Equal(t, uint(1), cfg.CacheCleanupInterval)
	require.Equal(t, "info", cfg.LogLevel)
	require.Equal(t, "", cfg.AdapterName)
}

func TestLoad_CustomEnvVars(t *testing.T) {
	setEnvs(t, map[string]string{
		"PACKAGE_NAME":           "@chainlink/tiingo-adapter",
		"HTTP_PORT":              "9090",
		"EA_PORT":                "7070",
		"EA_INTERNAL_HOST":       "0.0.0.0",
		"REDCON_PORT":            "6380",
		"METRICS_PORT":           "9090",
		"CACHE_TTL_MINUTES":      "10",
		"CACHE_CLEANUP_INTERVAL": "3",
		"LOG_LEVEL":              "debug",
	})

	cfg := Load()

	require.Equal(t, "9090", cfg.HTTPPort)
	require.Equal(t, "7070", cfg.EAPort)
	require.Equal(t, "0.0.0.0", cfg.EAHost)
	require.Equal(t, "6380", cfg.RedconPort)
	require.Equal(t, "9090", cfg.GoMetricsPort)
	require.Equal(t, uint(10), cfg.CacheTTLMinutes)
	require.Equal(t, uint(3), cfg.CacheCleanupInterval)
	require.Equal(t, "debug", cfg.LogLevel)
	require.Equal(t, "tiingo", cfg.AdapterName)
}
