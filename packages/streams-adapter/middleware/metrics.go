package middleware

import (
	"fmt"
	"strconv"

	"github.com/gin-gonic/gin"

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

// SetAssetPair sets the asset pair in the gin context for metrics tracking
// The asset pair is formatted as "{base}-{quote}-{endpoint}"
// Example: For request {"data":{"endpoint":"cryptolwba","from":"LINK","to":"USD"}}
//
//	the asset_pair will be "LINK-USD-cryptolwba"
func SetAssetPair(c *gin.Context, base, quote, endpoint string) {
	if base != "" && quote != "" {
		assetPair := fmt.Sprintf("%s-%s-%s", base, quote, endpoint)
		c.Set("asset_pair", assetPair)
	}
}
