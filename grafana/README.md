# Grafana dashboards

There are a number of dashboards provided that visualize adapter metrics in a useful manner via grafana.
The currently available dashboards are the following:

## ea-detailed

A dashboard that provides detailed insight into a single external adapter at a time.
See [here](./src/eaDetailed.jsonnet) to view the dashboard contents written in jsonnet via the [grafonnet](https://github.com/grafana/grafonnet-lib) library.

## ea-overview

A dashboard that provides a high level overview of all external adapters at a time.
See [here](./src/eaOverview.jsonnet) to view the dashboard contents written in jsonnet via the [grafonnet](https://github.com/grafana/grafonnet-lib) library.

# Deployment

## Requirements

- grizzly https://github.com/grafana/grizzly
- jb https://github.com/jsonnet-bundler/jsonnet-bundler
- jsonnet https://github.com/google/go-jsonnet

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
