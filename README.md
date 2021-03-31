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
(example for [coingecko](./packages/sources/coingecko) shown)

```bash
cd packages/sources/coingecko
yarn start
```

#### Docker

Take `bravenewcoin` as an example.

First create the image.

```bash
make docker adapter=bravenewcoin
```

The naming convention for Docker containers will be `$adapter-adapter`.

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

Run the command below to have the [example](./example) directory cloned using the name you provide for \$adapter:

```bash
make new adapter=my-adapter-name
```

_If on a Mac, this requires `gnu-sed` to be installed and set as the default for the command `sed`._

### Structure

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
The following section details mechanisms that reduce the number of API calls made from external adapters.

### Caching
Caching allows for the EA to store successful responses and facilitate faster future response times.

To enable, the following environment variables must be set:
```bash
export CACHE_ENABLED=true
```

See [/bootstrap](./packages/core/bootstrap#caching) for more details and configuration options.

#### Cache Warming
An additional functionality is cache warming which will poll APIs at certain intervals to keep the cache up to date.

To enable, the following environment variables must be set:
```bash
export CACHE_ENABLED=true EXPERIMENTAL_WARMUP_ENABLED=true
```
The cache will begin polling once the first request has been received.

### Rate Limiting
Rate limiting prevents hitting rate limit issues with data providers. To enable use the following environment keys:
```bash
export EXPERIMENTAL_RATE_LIMIT_ENABLED=true CACHE_ENABLED=true
```

There are two options for rate limiting:
1. Manual setting (example shown for limit at 10 requests/minute)
```bash
export RATE_LIMIT_CAPACITY=60
```
2. Limits by provider data (example for Coingecko free tier)
```bash
export RATE_LIMIT_API_PROVIDER=coingecko RATE_LIMIT_API_TIER=free
```
Preset tiers/plans can be found [here](./packages/core/ratelimits/src/limits.json) and use the corresponding `provider` and `tierName`.


See [/bootstrap](./packages/core/bootstrap#rate-limit) for more details on setup and [/ratelimits](./packages/core/ratelimits) for adding new providers to the preset plans.

### Multiple API Key Support

In order to use multiple API keys for an adapter, simply comma delimit the keys where you define the environment variable. This will work for an arbitrary number of keys.

```bash
API_KEY=myapikey1,myapikey2,myapikey3
```

The external adapter will then randomly rotate the keys. Over time this should balance out the number of requests between each of the API keys.

## Composite external adapters

To achieve more advanced functionality multiple external adapters can be chained together. See [/composites](./packages/composites) for more details.
