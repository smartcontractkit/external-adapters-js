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
	LabelIsCacheWarming     = "is_cache_warming"
	LabelFeedID             = "feed_id"
	LabelProviderStatusCode = "provider_status_code"
)

// Metrics holds all Prometheus metrics
type Metrics struct {
	HTTPRequestsTotal          *prometheus.CounterVec
	HTTPRequestDurationSeconds prometheus.Histogram
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
				LabelIsCacheWarming,
				LabelFeedID,
				LabelProviderStatusCode,
			},
		),
		HTTPRequestDurationSeconds: promauto.NewHistogram(
			prometheus.HistogramOpts{
				Name:    "http_request_duration_seconds",
				Help:    "A histogram bucket of the distribution of http request durations",
				Buckets: []float64{0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1},
			},
		),
	}
}

// RecordHTTPRequest records an HTTP request with all labels
func (m *Metrics) RecordHTTPRequest(method, statusCode, retry, requestType, isCacheWarming, feedID, providerStatusCode string) {
	m.HTTPRequestsTotal.WithLabelValues(
		method,
		statusCode,
		retry,
		requestType,
		isCacheWarming,
		feedID,
		providerStatusCode,
	).Inc()
}

// RecordHTTPRequestDuration records request duration in seconds
func (m *Metrics) RecordHTTPRequestDuration(durationSeconds float64) {
	m.HTTPRequestDurationSeconds.Observe(durationSeconds)
}
