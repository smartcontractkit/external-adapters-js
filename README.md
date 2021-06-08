# Chainlink External Adapters (TypeScript)

This repository contains the source code for Chainlink external adapters.

---

## Table of Contents

1. [Getting Started](#Getting-Started)
   - [Requirements](#Requirements)
   - [Install Dependencies](#Install)
   - [Setup](#Setup)
   - [Folder Structure](#Folder-Structure)
2. [List of External Adapters](#External-Adapters-List)
3. [Running](#Running)
   - [Configuration](#Requirements)
   - [HTTP server](#HTTP-server)
   - [Docker](#Docker)
   - [Single-Command Script](#Single-Command-Script)
4. [Advanced Features](#Advanced-Features)
   - [Performance](#Performance)
     - [Caching](#Caching)
     - [Rate Limiting](#Rate-Limiting)
     - [Cache Warming](#Cache-Warming)
   - [Multiple API Key Support](#Multiple-API-Key-Support)
   - [Bridge URL Query String Parameters](#Bridge-URL-Query-String-Parameters)
   - [Ticker Overrides](#Ticker-Overrides)
5. [Deployment](#Deployment)
   - [Container Images](#Container-Images)
   - [Running from ECR](#Running-from-ECR)
6. [Contributing](#Contributing)
   - [Create a new adapter](#Create-a-new-adapter)
   - [HTTP server](#HTTP-server)
   - [Input](#Input)
   - [Output](#Output)
   - [Common Patterns](#Common-Patterns)
   - [Testing](#Testing)

---

## Getting Started

### Requirements

- Yarn

### Install

```bash
yarn
```

Installs the dependencies for all workspaces.

### Setup

```bash
yarn setup
```

Runs the setup step for all adapters. Typically this step just compiles TypeScript, but may involve other tasks.

### Folder Structure

```
╠═.github - scripts automatically ran by the CI/CD workflow
║
╠═.husky - git hooks
║
╠═.vscode - code editor specific configuration
║
╠═.yarn - yarn 2 dependencies
║
╚═packages
    ║
    ╠══ composites - adapters composed of multiple other adapters for complex functionality
    ║
    ╠══ core - the internal framework used across all external adapters
    ║
    ╠══ examples - example templates for new external adapters
    ║
    ╠══ scripts - additional Node.js scripts for mono-repository management
    ║
    ╠══ sources - adapters that read data from a data provider's API.
    ║
    ╚══ targets - adapters that write data to a location, often a blockchain.
```

---

## External Adapters List

- [Source](./packages/sources/README.md)

- [Target](./packages/targets/README.md)

- [Composite](./packages/composites/README.md)

---

## Running

External adapters should be run as long-lived processes.
Each adapter may have configuration that is required to be supplied through environment variables.

### Configuration

There may be required environment variables that must be provided to run an External Adapter. Please see the respective adapter's README for more specific information on the External Adapter that you would like to run.

Every External Adapter has some optional environment variables for customizing behavior and turning on advanced features. More documentation for these can be seen [here](./packages/core/bootstrap/README.md)

---

There are two ways to run an External Adapter locally:

### HTTP server

Use the start command while in the directory of the adapter that you would like to run:  
(example for [coingecko](./packages/sources/coingecko) shown)

```bash
cd packages/sources/coingecko
yarn start
```

### Docker

1. All of the external-adapters have a service that is created when the repo's docker-compose file is generated.

This can be done by running the following command in the root of the repository:

```sh
yarn generate:docker-compose
```

2. Next create a container image. Use the generated `docker-compose.generated.yaml` file along with `docker-compose build`.

```sh
docker-compose -f docker-compose.generated.yaml build [adapter-name]
```

Where `[adapter-name]` is replaced with the following:

|   Parameter    |                                        Description                                         |                                       Options                                        |
| :------------: | :----------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------: |
| `adapter-name` | name of the external adapter package, usually the folder name with `-adapeter` as a suffix | See `docker-compose.generated.yaml` for list of services that can be used as options |

For example the `bravenewcoin` external adapter uses `bravenewcoin-adapter`:

```bash
docker-compose -f docker-compose.generated.yaml build bravenewcoin-adapter
```

3. Then run it with:

```bash
docker-compose -f docker-compose.generated.yaml run -p 8080:8080 -e API_KEY='YOUR_API_KEY' bravenewcoin-adapter
```

Environment files can also be passed through a file:

```
docker run -p 8080:8080 --env-file="~/PATH_TO_ENV" -it proof-of-reserves-adapter:latest
```

(Docker environment file's string values do not use " or ' quote marks)

### Single-Command Script

This command will start all of your external adapters with performance features enabled and with pre-defined metrics charts for each EA on a single server.

The first step will be to load up all of the environment variables that are needed across all of the External Adapters that will be ran. These can either be already be loaded into the environment or supplied to the startup script as a text file.

Starting from the root of the repository:

1. Ensure that the project is setup and that the docker-compose file has been generated

   ```json
   yarn && yarn setup && yarn generate:docker-compose
   ```

2. Use the startup script by supplying every External Adapter that you would like to run and monitor.

The adapter will have the format of `[[ADAPTER NAME]]-adapter`.

For example:

```json
cd grafana && ./scripts/compose.sh coingecko-adapter coinmarketcap-adapter
```

3. The running services can be found at the following ports:

- External Adapters - search `docker-compose.generated.yaml` for the name of your EA. The port it is running on will be found as the first number before the colon under `ports`.

```json
coincodex-adapter:
    image: coincodex-adapter:0.0.4
    ports:
      - 8112:8080 <----------- The first number before the colon here
    build:
      context: ..
      dockerfile: ./Dockerfile
      args:
        location: packages/sources/coincodex
        package: "@chainlink/coincodex-adapter"
      labels:
        com.chainlinklabs.external-adapter-type: sources
    environment:
      - EA_PORT=${EA_PORT}
```

- Prometheus - http://localhost:9090/graph
- Grafana - http://localhost:3000/

  The default login is:

  - Username: admin
  - Password: admin

---

## Advanced Features

### Performance

The following section details mechanisms that reduce the number of API calls made from external adapters. It is highly recommended to turn on the following three middlewares.

#### Caching

Caching allows for the EA to store successful responses and facilitate faster future response times.

To enable, the following environment variables must be set:

```bash
export CACHE_ENABLED=true
```

See [/bootstrap](./packages/core/bootstrap#caching) for more details and configuration options.

#### Rate Limiting

The Rate Limit middleware prevents hitting rate limit issues with data providers. This is done by adjusting how long a request lives in the cache based on the available capacity of your API subscription plan. To enable use the following environment keys:

```bash
export EXPERIMENTAL_RATE_LIMIT_ENABLED=true CACHE_ENABLED=true
```

There are two options for defining API subscription capacity:

1. Manual setting (example shown for limit at 10 requests/minute)

```bash
export RATE_LIMIT_CAPACITY=60
```

2. Limits by provider data (example for Coingecko free tier)

```bash
export RATE_LIMIT_API_PROVIDER=coingecko RATE_LIMIT_API_TIER=free
```

Preset tiers/plans can be found [here](./packages/core/bootstrap/src/lib/provider-limits/limits.json) and use the corresponding `provider` and `tierName`.

See [/bootstrap](./packages/core/bootstrap/README.md#rate-limit) for more details and configuration options.

#### Cache Warming

When a new unique request comes in to an EA the Cache Warming middleware will begin polling the API on an interval ensure that data is always ready to be served and is as fresh as possible.

To enable, the following environment variables must be set:

```bash
export CACHE_ENABLED=true EXPERIMENTAL_WARMUP_ENABLED=true
```

The cache will begin polling once the first request has been received.

See [/bootstrap](./packages/core/bootstrap/README.md#Cache-Warmer) for more details and configuration options.

### Multiple API Key Support

In order to use multiple API keys for an adapter, simply comma delimit the keys where you define the environment variable. This will work for an arbitrary number of keys.

```bash
API_KEY=myapikey1,myapikey2,myapikey3
```

The external adapter will then randomly rotate the keys. Over time this should balance out the number of requests between each of the API keys.

### Bridge URL Query String Parameters

Additional input parameters can be passed to an External Adapter through the Bridge URL that is specified when connecting an External Adapter to the core node.

This is useful in scenarios where when running multiple External Adapters to service a job spec there is a single External Adapter's behavior needs to be customized without affecting the others.

### Ticker Overrides

There are cases where a certain data provider might have different ticker symbol to represent a cryptocurrency, often when there are multiple cryptocurrencies that share the same ticker.

To help query the correct symbols the External Adapter request can contain an object of symbol overrides named `overrides`:

```json
"overrides": {
      "coinmarketcap": {
        "RAI": "RAI2"
      }
    },
```

In the above example when the `coinmarketcap` External Adapter is requested with a `base` of `RAI` the ticker will be changed to `RAI2`.

---

## Deployment

### Container Images

Images are being published to Chainlink's public AWS ECR repositories:
`public.ecr.aws/chainlink/adapters`

They can also be found in the public gallery, the registry name is `chainlink`.
(e.g. `https://gallery.ecr.aws/chainlink/adapters/1forge-adapter`)

The External Adapters are being tagged with semantic releases to allow for automated upgrades.

### Running from ECR

The EA container image can be download by using the [docker pull command](https://docs.docker.com/engine/reference/commandline/pull/). For example:

```json
docker pull public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

To run the image use the [docker run command](https://docs.docker.com/engine/reference/run/). For example:

```json
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

It can be helpful to pass a text file to the container to handle giving multiple environment variables:

```json
docker run -p 8080:8080 --env-file=[[path to your env file]] public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

---

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

### Input

When flux monitor or OCR jobs from the core Chainlink node post to external adapters, the request body looks as follows:

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

### Output

The External Adapter will do some processing, often request data from an API, and return the following response structure:

```json
  {
    "jobRunID": "2cae6a10e5184aa685c3428964b02418",
    "statusCode": 200,
    "data": {
      "result": 3000 // Result for Flux Monitor jobs.
      // ... Response data
    },
    "result": 3000 // Result for OCR jobs.
    "maxAge": 222, // [OPTIONAL] metadata for how long the request is cached for
    "debug": { // [OPTIONAL]
      // Additional metadata from the EA framework used for tracking metrics
    }
  }
```

### Common Patterns

- For handling big numbers the `BigNumber.js` dependency should be used for integer operations, and `Decimal` for floating point operations. By default decimal.js uses a precision of 20. As we could lose some precision with really large numbers, it should be updated to a higher precision before usage:

```
Decimal.set({ precision: 100 })
```

### Common Issues

### Testing

In order to test adapters locally, you may need to set an `$API_KEY` environment variable for the given API or other required environment variables.

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
