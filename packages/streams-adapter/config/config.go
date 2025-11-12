package config

import (
	"os"
	"strconv"
)

// Config holds all configuration for the adapter
type Config struct {
	HTTPPort   string
	EAPort     string
	EAHost     string
	RedconPort string

	// Cache configuration
	CacheMaxSize         int // Maximum number of cache items (0 = default 10000)
	CacheTTLMinutes      int // Cache TTL in minutes (0 = default 5 minutes)
	CacheCleanupInterval int // Cache cleanup interval in minutes (0 = default 1 minute)

	// Other configuration
	LogLevel string
}

// Load reads configuration from environment variables
func Load() *Config {
	cfg := &Config{

		HTTPPort:   getEnv("HTTP_PORT", "8080"),
		EAPort:     getEnv("EA_PORT", "8070"),
		EAHost:     getEnv("EA_INTERNAL_HOST", "localhost"),
		RedconPort: getEnv("REDCON_PORT", "6379"),

		// Cache configuration
		CacheMaxSize:         getEnvAsInt("CACHE_MAX_SIZE", 10000),
		CacheTTLMinutes:      getEnvAsInt("CACHE_TTL_MINUTES", 5),
		CacheCleanupInterval: getEnvAsInt("CACHE_CLEANUP_INTERVAL", 1),

		// Other
		LogLevel: getEnv("LOG_LEVEL", "info"),
	}

	return cfg
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as integer with a default value
func getEnvAsInt(key string, defaultValue int) int {
	valueStr := getEnv(key, "")
	if value, err := strconv.Atoi(valueStr); err == nil {
		return value
	}
	return defaultValue
}
