package metrics

import (
	"fmt"
	"log/slog"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
	"github.com/prometheus/common/expfmt"
)

// Metric families already implemented in the Go adapter.
var excludedFamilies = map[string]bool{
	"http_requests_total":           true,
	"http_request_duration_seconds": true,
}

// Forwarder scrapes the JS adapter's Prometheus endpoint and returns metric
// families not already tracked by the Go adapter.
type Forwarder struct {
	url    string
	client *http.Client
}

// NewForwarder creates a Forwarder that fetches metrics from jsMetricsURL.
func NewForwarder(jsMetricsURL string) *Forwarder {
	return &Forwarder{
		url:    jsMetricsURL,
		client: &http.Client{Timeout: 5 * time.Second},
	}
}

// FilteredFamilies fetches JS adapter metrics and returns only families
// not already implemented in Go.
func (f *Forwarder) FilteredFamilies() ([]*dto.MetricFamily, error) {
	resp, err := f.client.Get(f.url)
	if err != nil {
		return nil, fmt.Errorf("fetching JS metrics: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("JS metrics endpoint returned %d", resp.StatusCode)
	}

	var parser expfmt.TextParser
	families, err := parser.TextToMetricFamilies(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("parsing JS metrics: %w", err)
	}

	result := make([]*dto.MetricFamily, 0, len(families))
	for name, fam := range families {
		if !excludedFamilies[name] {
			result = append(result, fam)
		}
	}
	return result, nil
}

// CombinedGatherer implements prometheus.Gatherer by merging Go-native
// metrics with forwarded (and filtered) JS adapter metrics.
type CombinedGatherer struct {
	forwarder *Forwarder
	logger    *slog.Logger
}

// NewCombinedGatherer returns a Gatherer that combines Go and JS metrics.
func NewCombinedGatherer(forwarder *Forwarder, logger *slog.Logger) prometheus.Gatherer {
	return &CombinedGatherer{forwarder: forwarder, logger: logger}
}

// Gather implements prometheus.Gatherer.
func (g *CombinedGatherer) Gather() ([]*dto.MetricFamily, error) {
	goFamilies, err := prometheus.DefaultGatherer.Gather()
	if err != nil {
		return nil, err
	}

	jsFamilies, err := g.forwarder.FilteredFamilies()
	if err != nil {
		g.logger.Error("Could not fetch JS adapter metrics, serving Go-only", "error", err)
		return goFamilies, nil
	}

	return append(goFamilies, jsFamilies...), nil
}
