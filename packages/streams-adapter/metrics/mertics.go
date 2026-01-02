// metrics/metrics.go
package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
)

// Label names for HTTP requests metric
const (
	LabelMethod             = "method"
	LabelStatusCode         = "status_code"
	LabelRetry              = "retry"
	LabelType               = "type"
	LabelAssetPair          = "asset_pair"
	LabelProviderStatusCode = "provider_status_code"
)

// Metrics holds all Prometheus metrics
type Metrics struct {
	HTTPRequestsTotal *prometheus.CounterVec
}

// NewMetrics creates and registers all metrics
func NewMetrics() *Metrics {
	return &Metrics{
		HTTPRequestsTotal: promauto.NewCounterVec(
			prometheus.CounterOpts{
				Name: "http_requests_total",
				Help: "The number of http requests this external adapter has serviced for its entire uptime",
			},
			[]string{
				LabelMethod,
				LabelStatusCode,
				LabelRetry,
				LabelType,
				LabelAssetPair,
				LabelProviderStatusCode,
			},
		),
	}
}

// RecordHTTPRequest records an HTTP request with all labels
func (m *Metrics) RecordHTTPRequest(method, statusCode, retry, requestType, assetPair, providerStatusCode string) {
	m.HTTPRequestsTotal.WithLabelValues(
		method,
		statusCode,
		retry,
		requestType,
		assetPair,
		providerStatusCode,
	).Inc()
}
