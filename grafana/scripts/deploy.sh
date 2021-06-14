#!/bin/bash

export GRAFANA_URL=http://localhost:3000
export GRAFANA_USER=admin
export GRAFANA_TOKEN=admin

jsonnet \
  --ext-str dashboardUid='REEEE' \
  --ext-str dashboardTitle='External Adapters' \
  --ext-str cortexDataSource='Prometheus' \
  --ext-str prometheusJobName='external_adapters_local' \
  -o ./generated/eaDetailed.json \
  -J ./vendor \
  ./src/eaDetailed.jsonnet

jsonnet \
  --ext-str dashboardUid='REEEEEE' \
  --ext-str dashboardTitle='External Adapters Overview' \
  --ext-str cortexDataSource='Prometheus' \
  --ext-str prometheusJobName='external_adapters_local' \
  -o ./generated/eaOverview.json \
  -J ./vendor \
  ./src/eaOverview.jsonnet


grr apply ./dashboards.jsonnet
