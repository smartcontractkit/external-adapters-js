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

---

# Adding a new Codified dashboard

1. Create a new `jsonnet` file in `grafana/src`.
2. Import the required depencencies for your dashboard. You can get an idea of what this looks like from the other `jsonnet` dashboards.
3. Create panels.

---

## Adding a new panel:

Read the [Grafonnet Docs](https://grafana.github.io/grafonnet-lib/api-docs/) for more information, but there are quick an easy ways to add new panels.

[Here](./src/eaRelease.jsonnet#L24) is an example of a panel, which has a few parameters that determine what it looks like in the dashboard. Also, see an example of a simple text panel [here](./src/eaRelease.jsonnet#L20)

The `promQL query` is a query that interacts with the Prometheus/Grafana cloud database. If you are turning an already existing dashboard into a codified one, you can simply copy the promQL from that panel directly into the `jsonnet` file.

Most dashboards have pieces of promQL queries repeated throughout. For easy customizability and readability, the existing dashboards save these repeated strings as variables, and reuse them throughout. They are defined as constants in `grafana/src/shared.libsonnet`

---

## Defining the grid:

The layout of the panels is defined as a grid, which is an array of objects defining the size and order of one or more panels.
See an example of a grid [here](./src/eaRelease.jsonnet#L197)

---

## Launching the dashboard

After defining the grid, add the [following line](./src/eaRelease.jsonnet#L274) to the bottom of the code to build the dashboard.

A template is a placeholder for a value and can be used to filter all the panels in a given dashboard. Templates are configured in `shared.libsonnet`. (More on templates [here](https://grafana.com/docs/grafana/latest/variables/))
