package middleware

import (
	"strconv"

	"github.com/gin-gonic/gin"

	types "streams-adapter/common"
	"streams-adapter/helpers"
	"streams-adapter/metrics"
)

// MetricsMiddleware creates a middleware that records HTTP request metrics
func MetricsMiddleware(m *metrics.Metrics) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Process the request
		c.Next()

		// After the request is processed, record the metrics
		method := c.Request.Method
		statusCode := strconv.Itoa(c.Writer.Status())

		// Extract asset_pair from request body if present
		assetPair := extractAssetPair(c)

		// For now, set default values for optional labels
		// These can be enhanced later to extract actual values from context
		retry := "0"
		requestType := determineRequestType(c)
		providerStatusCode := ""

		// Record the metric
		m.RecordHTTPRequest(method, statusCode, retry, requestType, assetPair, providerStatusCode)
	}
}

// extractAssetPair extracts the asset pair from the request
// Asset pair is derived from the base and quote assets
func extractAssetPair(c *gin.Context) string {
	// Try to get asset_pair from gin context (set by handler)
	if assetPair, exists := c.Get("asset_pair"); exists {
		return assetPair.(string)
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
		requestKey := helpers.CalculateCacheKey(params)
		c.Set("asset_pair", requestKey)
	}
}
