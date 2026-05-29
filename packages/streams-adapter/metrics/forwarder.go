package metrics

import (
	"fmt"
	"net/http"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	dto "github.com/prometheus/client_model/go"
	"github.com/prometheus/common/expfmt"
	"github.com/prometheus/common/model"
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
func NewForwarder(jsMetricsURL string, timeout time.Duration) *Forwarder {
	return &Forwarder{
		url:    jsMetricsURL,
		client: &http.Client{Timeout: timeout},
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

	parser := expfmt.NewTextParser(model.UTF8Validation)
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

// CombinedGatherer returns a prometheus.Gatherer that merges Go-native
// metrics with forwarded (and filtered) JS adapter metrics.
// If the JS adapter is unreachable, Go-only metrics are served silently.
func CombinedGatherer(forwarder *Forwarder) prometheus.Gatherer {
	return prometheus.GathererFunc(func() ([]*dto.MetricFamily, error) {
		goFamilies, err := prometheus.DefaultGatherer.Gather()
		if err != nil {
			return nil, err
		}

		jsFamilies, err := forwarder.FilteredFamilies()
		if err != nil {
			return goFamilies, nil
		}

		return append(goFamilies, jsFamilies...), nil
	})
}
