# Grafana dashboards

There are a number of dashboards provided that visualize adapter metrics in a useful manner via grafana.
The currently available dashboards are the following:

## ea-detailed

A dashboard that provides detailed insight into a single external adapter at a time.
See [here](./src/eaDetailed.jsonnet) to view the dashboard contents written in jsonnet via the [grafonnet](https://github.com/grafana/grafonnet-lib) library.

# Adding a new Codified dashboard

## Adding a new panel:

Read the [Grafonnet Docs](https://grafana.github.io/grafonnet-lib/api-docs/) for more information, but there are quick an easy ways to add new panels.

### For a graph panel, copy this template:

```
local panelName = graphPanel.new(
  title='Panel Title',
  datasource=cortexDataSource,
  format='pecrent',
).addTarget(
  prometheus.target(
    'promQL query'
  )
);
```

## ea-overview

A dashboard that provides a high level overview of all external adapters at a time.
See [here](./src/eaOverview.jsonnet) to view the dashboard contents written in jsonnet via the [grafonnet](https://github.com/grafana/grafonnet-lib) library.

# Deployment

## Requirements

Tn

## Process

1. Navigate to the [grafana folder](.)

```sh
cd grafana
```

2. Install required dependencies to generate dashboards

```sh
jb install
```

4. Deploy the dashboards via [deployment](./scripts/deploy) script, view the script for
   environment variables to set

```sh
./scripts/deploy.sh
```
