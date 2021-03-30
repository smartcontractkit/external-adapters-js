# Chainlink External Adapters (TypeScript)

This repository contains the source for Chainlink external adapters.

Each adapter must document its own required parameters and output format. See the individual README for more specific usage details.

## Table of Contents

1. [Getting Started](#Getting-Started)
2. [Contributing](#Contributing)
3. [Deployment](#Deployment)
4. [Performance](#Advanced)
5. [Composite adapters](#Composite-external-adapters)

## Getting Started

### Requirements

- Yarn

### Install

```bash
yarn
```

Installs packages for all workspaces.

### Setup

```bash
yarn setup
```

Runs the setup step for all adapters. Typically this step just compiles TypeScript, but may involve other tasks.

### Running Locally

External adapters should be run as long-lived processes. Two ways to run them locally are:

#### HTTP server

Use the start command while in the directory of the adapter that you would like to run:

```bash
yarn start
```

#### Docker

Take `bravenewcoin` as an example.

First create the image. Use the provided `docker` script with two arguments:

- adapter - the path to adapter from `./packages`
- name - the name of the folder that contains the external adapter

```bash
yarn docker sources bravenewcoin
```

The naming convention for Docker containers will be contain the `-adapter` suffix.

Then run it with:

```bash
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -it bravenewcoin-adapter:latest
```

TIP: If there are a large amount of environment variables it may be more convenient to pass a file.

(Docker environment file string values do not use " or ' quote marks)

Then run it with:

```bash
docker run -p 8080:8080 --env-file="~/PATH_TO_ENV" -it proof-of-reserves-adapter:latest
```

### Input

This is an example, a JSON body the adapter will receive when plugged into the Chainlink node pipeline:

```json
{
  "id": "2cae6a10e5184aa685c3428964b02418",
  "data": { "from": "ETH", "to": "USD" },
  "meta": {
    "availableFunds": 99900000000000000000,
    "eligibleToSubmit": true,
    "latestAnswer": 39307000000,
    "oracleCount": 1,
    "paymentAmount": 100000000000000000,
    "reportableRoundID": 2,
    "startedAt": 0,
    "timeout": 0
  }
}
```

When the FluxMonitor posts to External Adapters, it will include the `RoundState` as the "meta" field in the request, serialized to a JSON object with lower camelCase keys.

Optionally `data` parameters can also be passed via a query string added to the [Bridge](https://docs.chain.link/docs/node-operators) URL like: `{ENDPOINT}?from=ETH&to=USD`. This is useful when trying to conform to unified input parameters.

## Contributing

### Create a new adapter

To get started from one of the example adapters seen in [examples](./packages/examples) use the `new` script with two arguments:

- `type` - the name of the template to use
- `name` - what to call the new adapter

```
yarn new [template type] [name of adapter]
```

For example

```
yarn new source my-new-adapter
```

_If on a Mac, this requires `gnu-sed` to be installed and set as the default for the command `sed`._

### Test

In order to test adapters locally, you may need to set an `$API_KEY` environment variable for the given API.

```bash
cd $adapter
yarn test
```

## Deployment

Coming Soon

<!-- TODO: container based deployment documentation -->

## Performance

### Caching

### Rate Limiting

### Multiple API Key Support

In order to use multiple API keys for an adapter, simply comma delimit the keys where you define the environment variable. This will work for an arbitrary number of keys.

```
API_KEY=myapikey1,myapikey2,myapikey3
```

The external adapter will then randomly rotate the keys. Over time this should balance out the number of requests between each of the API keys.

## Composite external adapters

To achieve more advanced functionality multiple external adapters can be chained together. See [/composite](./composite/README) for more details.
