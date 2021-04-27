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

External adapters should be run as long-lived processes. They can be found under various folders:

- [`packages/sources`](./packages/sources): adapters for reading data from API sources
- [`packages/targets`](./packages/targets): adapters for writing data
- [`packages/composites`](./packages/composites): chaining multiple adapters for advanced functionality

Note that each adapter may have required environment variables. Please see the respective adapter folder for more information.

Two ways to run them locally are:

#### HTTP server

Use the start command while in the directory of the adapter that you would like to run:  
(example for [coingecko](./packages/sources/coingecko) shown)

```bash
cd packages/sources/coingecko
yarn start
```

#### Docker

All of the external-adapters have a service that is created when the repo's docker-compose file is generated.

```sh
yarn generate:docker-compose
```

Take `bravenewcoin-adapter` as an example.

First create the image. Use the provided `docker-compose.generated.yaml` file along with `docker-compose build`:

```sh
docker-compose -f docker-compose.generated.yaml build adapter-name
```

|   Parameter    |                 Description                  |                                       Options                                        |
| :------------: | :------------------------------------------: | :----------------------------------------------------------------------------------: |
| `adapter-name` | name of the folder that contains the adapter | See `docker-compose.generated.yaml` for list of services that can be used as options |

`bravenewcoin-adapter` example:

```bash
docker-compose -f docker-compose.generated.yaml build bravenewcoin-adapter
```

Then run it with:

```bash
docker-compose -f docker-compose.generated.yaml run -p 8080:8080 -e API_KEY='YOUR_API_KEY' -it bravenewcoin-adapter
```

(Docker environment file string values do not use " or ' quote marks)

### Input

When flux monitor or OCR jobs post to external adapters, the request body looks as follows:

```json
{
  "id": "2cae6a10e5184aa685c3428964b02418",
  "data": { "from": "ETH", "to": "USD" },
  "meta": {
    "latestAnswer": 39307000000,
    "updatedAt": 1616448197
  }
}
```

The `updatedAt` field is a unix timestamp representing when the `latestAnswer` was computed.

Optionally `data` parameters can also be passed via a query string added to the [Bridge](https://docs.chain.link/docs/node-operators) URL like: `{ENDPOINT}?from=ETH&to=USD`. This is useful when trying to conform to unified input parameters.

## Contributing

### Create a new adapter

To get started from one of the example adapters seen in [examples](./packages/examples) use the `new` script with two arguments:

```bash
yarn new [template-type] [name-of-adapter]
```

|     Parameter     |           Description           |         Options         |
| :---------------: | :-----------------------------: | :---------------------: |
|  `template-type`  | the name of the template to use | `composites`, `sources` |
| `name-of-adapter` |  what to call the new adapter   |      user-defined       |

For example

```
yarn new source my-new-adapter
```

_If on a Mac, this requires `gnu-sed` to be installed and set as the default for the command `sed`._

### Common Patterns

- For handling big numbers the `BigNumber.js` dependency should be used for integer operations, and `Decimal` for floating point operations. By default decimal.js uses a precision of 20. As we could lose some precision with really large numbers, it should be updated to a higher precision before usage:

```
Decimal.set({ precision: 100 })
```

### Test

In order to test adapters locally, you may need to set an `$API_KEY` environment variable for the given API.

Make sure you run these commands from the ROOT of this monorepo.

```bash
# Build all packages
yarn setup

# Run all unit tests
yarn test unit

# Run all integration tests
yarn test integration

adapter=myadapter # Your adapter name, coinmarketcap, coingecko, etc

# Run integration tests for that adapter
yarn test $adapter/test/integration

# Run unit tests for that adapter
yarn test $adapter/test/unit

# Run a specific test for that adapter
yarn test $adapter/test/unit/my-specific-test.test.ts

# Run a tests in watch mode, re-running tests that have code changes or dependency changes in them
yarn test --watch $adapter/test/unit
```

For more information, see the [Jest docs.](https://jestjs.io/docs/cli)

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
