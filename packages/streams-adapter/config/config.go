package config

import (
	"os"
	"strconv"
	"strings"
)

// Config holds all configuration for the adapter
type Config struct {
	HTTPPort      string
	EAPort        string
	EAHost        string
	RedconPort    string
	GoMetricsPort string

	// Cache configuration
	CacheMaxSize         uint // Maximum number of cache items (0 = default 10000)
	CacheTTLMinutes      uint // Cache TTL in minutes (0 = default 5 minutes)
	CacheCleanupInterval uint // Cache cleanup interval in minutes (0 = default 1 minute)

	// Other configuration
	LogLevel    string
	AdapterName string
}

// Load reads configuration from environment variables
func Load() *Config {
	packageName := os.Getenv("PACKAGE_NAME")
	adapterName := extractAdapterName(packageName)

	cfg := &Config{
		HTTPPort:      getEnv("HTTP_PORT", "8080"),
		EAPort:        getEnv("EA_PORT", "8070"),
		EAHost:        getEnv("EA_INTERNAL_HOST", "localhost"),
		RedconPort:    getEnv("REDCON_PORT", "6379"),
		GoMetricsPort: getEnv("GO_METRICS_PORT", "9080"),

		// Cache configuration
		CacheMaxSize:         getEnvAsInt("CACHE_MAX_SIZE", 10000),
		CacheTTLMinutes:      getEnvAsInt("CACHE_TTL_MINUTES", 5),
		CacheCleanupInterval: getEnvAsInt("CACHE_CLEANUP_INTERVAL", 1),

		// Other
		LogLevel:    getEnv("LOG_LEVEL", "info"),
		AdapterName: adapterName,
	}

	return cfg
}

// extractAdapterName derives the adapter name from package name
// e.g., "@chainlink/tiingo-adapter" -> "tiingo"
func extractAdapterName(packageName string) string {
	name := packageName
	name = strings.TrimPrefix(name, "@chainlink/")
	name = strings.TrimSuffix(name, "-adapter")
	return name
}

// getEnv gets an environment variable with a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvAsInt gets an environment variable as integer with a default value
func getEnvAsInt(key string, defaultValue uint) uint {
	valueStr := getEnv(key, "")
	if value, err := strconv.ParseUint(valueStr, 10, 64); err == nil {
		return uint(value)
	}
	return defaultValue
}
