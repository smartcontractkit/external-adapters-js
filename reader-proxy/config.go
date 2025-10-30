package main

import (
	"log"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config holds the proxy configuration
type Config struct {
	Port                 int
	DownstreamURL        string
	CacheTTL             time.Duration
	CacheCleanupInterval time.Duration
	DownstreamTimeout    time.Duration
	ReadTimeout          time.Duration
	WriteTimeout         time.Duration
	IdleTimeout          time.Duration
	CacheKeyHeaders      []string
	Cache404             bool
}

// LoadConfig loads configuration from environment variables with defaults
func LoadConfig() *Config {
	return &Config{
		Port:                 getEnvInt("PORT", 8080),
		DownstreamURL:        getEnv("DOWNSTREAM_URL", "http://localhost:8081"),
		CacheTTL:             getEnvDuration("CACHE_TTL", 30*time.Second),
		CacheCleanupInterval: getEnvDuration("CACHE_CLEANUP_INTERVAL", 60*time.Second),
		DownstreamTimeout:    getEnvDuration("DOWNSTREAM_TIMEOUT", 30*time.Second),
		ReadTimeout:          getEnvDuration("READ_TIMEOUT", 10*time.Second),
		WriteTimeout:         getEnvDuration("WRITE_TIMEOUT", 10*time.Second),
		IdleTimeout:          getEnvDuration("IDLE_TIMEOUT", 120*time.Second),
		CacheKeyHeaders:      getEnvStringSlice("CACHE_KEY_HEADERS", []string{}),
		Cache404:             getEnvBool("CACHE_404", false),
	}
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt gets an integer environment variable or returns a default value
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intVal, err := strconv.Atoi(value); err == nil {
			return intVal
		}
		log.Printf("Invalid integer value for %s: %s, using default: %d", key, value, defaultValue)
	}
	return defaultValue
}

// getEnvDuration gets a duration environment variable or returns a default value
func getEnvDuration(key string, defaultValue time.Duration) time.Duration {
	if value := os.Getenv(key); value != "" {
		if duration, err := time.ParseDuration(value); err == nil {
			return duration
		}
		log.Printf("Invalid duration value for %s: %s, using default: %v", key, value, defaultValue)
	}
	return defaultValue
}

// getEnvBool gets a boolean environment variable or returns a default value
func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		if boolVal, err := strconv.ParseBool(value); err == nil {
			return boolVal
		}
		log.Printf("Invalid boolean value for %s: %s, using default: %v", key, value, defaultValue)
	}
	return defaultValue
}

// getEnvStringSlice gets a comma-separated string slice from environment or returns default
func getEnvStringSlice(key string, defaultValue []string) []string {
	if value := os.Getenv(key); value != "" {
		parts := strings.Split(value, ",")
		result := make([]string, 0, len(parts))
		for _, part := range parts {
			if trimmed := strings.TrimSpace(part); trimmed != "" {
				result = append(result, trimmed)
			}
		}
		if len(result) > 0 {
			return result
		}
	}
	return defaultValue
}
