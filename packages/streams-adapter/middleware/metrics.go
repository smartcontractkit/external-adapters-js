package middleware

import (
	"strconv"
	"time"

	"github.com/gin-gonic/gin"

	types "streams-adapter/common"
	"streams-adapter/helpers"
	"streams-adapter/metrics"
)

// MetricsMiddleware creates a middleware that records HTTP request metrics
func MetricsMiddleware(m *metrics.Metrics) gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()

		// Process the request
		c.Next()

		// After the request is processed, record the metrics
		method := c.Request.Method
		statusCode := strconv.Itoa(c.Writer.Status())

		// Extract feed_id value from request context if present
		feedID := extractFeedID(c)

		// For now, set default values for optional labels
		// These can be enhanced later to extract actual values from context
		retry := "0"
		requestType := determineRequestType(c)
		isCacheWarming := "false"
		providerStatusCode := ""

		// Record the metric
		m.RecordHTTPRequest(method, statusCode, retry, requestType, isCacheWarming, feedID, providerStatusCode)
		m.RecordHTTPRequestDuration(time.Since(start).Seconds())
	}
}

// extractFeedID extracts the feed_id from the request.
func extractFeedID(c *gin.Context) string {
	// Try to get feed_id from gin context (set by handler)
	if feedID, exists := c.Get("feed_id"); exists {
		return feedID.(string)
	}
	return ""
}

// determineRequestType determines the type of request based on the path
func determineRequestType(c *gin.Context) string {
	path := c.Request.URL.Path
	switch path {
	case "/health":
		return "health"
	case "/":
		return "adapter"
	case "/metrics":
		return "metrics"
	default:
		if len(path) > 6 && path[:7] == "/debug/" {
			return "debug"
		}
		return "other"
	}
}

// SetRequestParams sets the request parameters in the gin context for metrics tracking
// The params are formatted using the same logic as cache keys
func SetRequestParams(c *gin.Context, params types.RequestParams) {
	if len(params) > 0 {
		// Use the same key generation logic as cache for consistency
		if requestKey, err := helpers.CalculateCacheKey(params); err == nil {
			c.Set("feed_id", requestKey)
		}
	}
}
