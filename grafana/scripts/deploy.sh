#!/bin/bash
set -e
# The URL of your grafana server
export GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"

# Basic Auth, use GRAFANA_TOKEN only when using API key auth method
# See https://github.com/grafana/grizzly#grafana-itself for more details
export GRAFANA_USER="${GRAFANA_USER:-admin}"
export GRAFANA_TOKEN="${GRAFANA_TOKEN:-admin}"

# The title to assign the detailed dashboard panel, must be globally unique for all 
# deployed grafana dashboards
EA_DETAILED_DASHBOARD_TITLE="${EA_DETAILED_DASHBOARD_TITLE:-External Adapters}"
# The title to assign the overview dashboard panel, must be globally unique for all 
# deployed grafana dashboards
EA_OVERVIEW_DASHBOARD_TITLE="${EA_OVERVIEW_DASHBOARD_TITLE:-External Adapters Overview}"
# The name of the grafana data source that contains your prometheus instance
EA_DATA_SOURCE="${EA_DATA_SOURCE:-Prometheus}"
# The value of scrape_configs[].job_name within `prometheus.yml` that contains your external
# adapters
EA_PROMETHEUS_JOB_NAME="${EA_PROMETHEUS_JOB_NAME:-'external_adapters_local'}"

>/dev/null pushd "$(git rev-parse --show-toplevel)/grafana" || exit 1
jsonnet \
  --ext-str dashboardTitle="$EA_DETAILED_DASHBOARD_TITLE" \
  --ext-str dashboardUid="$(echo "$EA_DETAILED_DASHBOARD_TITLE" | sha1sum | awk '{ print $1 }')" \
  --ext-str cortexDataSource="$EA_DATA_SOURCE" \
  --ext-str prometheusJobName="$EA_PROMETHEUS_JOB_NAME" \
  -o ./generated/eaDetailed.json \
  -J ./vendor \
  ./src/eaDetailed.jsonnet

jsonnet \
  --ext-str dashboardTitle="$EA_OVERVIEW_DASHBOARD_TITLE" \
  --ext-str dashboardUid="$(echo "$EA_OVERVIEW_DASHBOARD_TITLE" | sha1sum | awk '{ print $1 }')" \
  --ext-str cortexDataSource="$EA_DATA_SOURCE" \
  --ext-str prometheusJobName="$EA_PROMETHEUS_JOB_NAME" \
  -o ./generated/eaOverview.json \
  -J ./vendor \
  ./src/eaOverview.jsonnet

grr apply ./dashboards.jsonnet

>/dev/null popd || exit 
