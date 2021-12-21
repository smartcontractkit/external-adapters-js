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

- [Master](./MASTERLIST.md)

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

   ```
   yarn && yarn setup && yarn generate:docker-compose
   ```

2. Use the startup script by supplying every External Adapter that you would like to run and monitor.

The adapter will have the format of `[[ADAPTER NAME]]-adapter`.

For example:

```
cd grafana && ./scripts/compose.sh coingecko-adapter coinmarketcap-adapter
```

3. The running services can be found at the following ports:

- External Adapters - search `docker-compose.generated.yaml` for the name of your EA. The port it is running on will be found as the first number before the colon under `ports`.

```yml
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

> ### ⚠️ Note
>
> Please check and ensure caching is allowed and not in violation of the Terms of Service of the data provider's API. Disable caching flags if it is not supported by the specified API provider's TOS.

Caching is enabled by default. It can be turned off using:

```bash
export CACHE_ENABLED=false
```

See [/bootstrap](./packages/core/bootstrap#caching) for more details and configuration options.

#### Rate Limiting

The Rate Limit middleware prevents hitting rate limit issues with data providers. This is done by adjusting how long a request lives in the cache based on the available capacity of your API subscription plan. The cache must be enabled to use this middleware.

Rate Limiting is enabled by default. It can be turned off using:

```bash
export RATE_LIMIT_ENABLED=false
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

The `RATE_LIMIT_API_PROVIDER` environment variable is optional as when not given it will derive from the running adapter.

Preset tiers/plans can be found [here](./packages/core/bootstrap/src/lib/provider-limits/limits.json) and use the corresponding `provider` and `tierName`.

See [/bootstrap](./packages/core/bootstrap/README.md#rate-limit) for more details and configuration options.

#### Cache Warming

When a new unique request comes in to an EA the Cache Warming middleware will begin polling the API on an interval ensure that data is always ready to be served and is as fresh as possible. The cache must be enabled to use this middleware.

Cache Warming is enabled by default. It can be turned off using:

```bash
export WARMUP_ENABLED=false
```

The cache will begin polling once the first request has been received.
It will also attempt to use batch requests to save API credits when possible.

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

```
docker pull public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

To run the image use the [docker run command](https://docs.docker.com/engine/reference/run/). For example:

```
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

It can be helpful to pass a text file to the container to handle giving multiple environment variables:

```
docker run -p 8080:8080 --env-file=[[path to your env file]] public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

---

## Contributing

### Create a new adapter

To get started from one of the example adapters seen in [examples](./packages/examples) use the `new` script with two arguments:

```bash
yarn new [template-type] [name-of-adapter]
```

|     Parameter     |           Description           |        Options        |
| :---------------: | :-----------------------------: | :-------------------: |
|  `template-type`  | the name of the template to use | `composite`, `source` |
| `name-of-adapter` |  what to call the new adapter   |     user-defined      |

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

```javascript
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

- Handling "includes" in the request should be done with the following priority:
  1. Full-featured "includes" array (in the format of [presetIncludes.json](packages/core/bootstrap/src/lib/external-adapter/overrides/presetIncludes.json))
  2. Pre-set includes from the EA (set in [presetIncludes.json](packages/core/bootstrap/src/lib/external-adapter/overrides/presetIncludes.json))
  3. String array as "includes"

### Common Issues

### Testing

In order to test adapters locally, you may need to set an `$API_KEY` environment variable for the given API or other required environment variables.

Make sure you run these commands from the ROOT of this monorepo.

```bash
# Build all packages
yarn setup

# Run all unit tests
yarn test:unit

# Run all integration tests
yarn test:integration

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

#### Soak Testing

In order to soak test adapters we need to create and push the adapter out to the sdlc cluster. From there we can use the Flux Emulator or K6 to send traffic to it for the amount of time you need.

Prerequisites to starting an external adapter in the sdlc cluster

1. You must be on the vpn to access the k8s cluster.
2. You must have your kubeconfig set to the sdlc cluster which also requires you be logged into the aws secure-sdlc account as a user with k8s permissions. To do so it would look something like this but with your specific profile name `aws sso login --profile sdlc`. Instructions to set this up and set your kubeconfig can be found here: https://www.notion.so/chainlink/QA-Kubernetes-Cluster-ca3f1a64e6fd4476ac5a76c8bfcd8624
3. In order to pull the external adapter helm chart you need to have a GitHub PAT and add the chainlik helm repo using the instructions here: https://github.com/smartcontractkit/charts

To spin up an adapter in the sdlc cluster:

```bash
# Build all packages
yarn install
yarn setup

# Build the docker-compose
# The uniqueName can be your name or something unique to you, for example in ci it will use the PR number
# Change the adapter name to the adapter you are testing
export AWS_PROFILE=sdlc
export AWS_REGION=us-west-2
export UNIQUE_NAME=unique-name
export ADAPTER_NAME=coingecko
export IMAGE_PREFIX=795953128386.dkr.ecr.us-west-2.amazonaws.com/adapters/
export IMAGE_TAG=pr${UNIQUE_NAME}
IMAGE_TAG=${IMAGE_TAG} IMAGE_PREFIX=${IMAGE_PREFIX} yarn generate:docker-compose

# Build the docker image
docker-compose -f docker-compose.generated.yaml build ${ADAPTER_NAME}-adapter

# Push adapter image to private ecr
# If you haven't logged into the docker repository you may need to do this before the push will work
# aws ecr get-login-password --region ${AWS_REGION} --profile ${AWS_PROFILE} | docker login --username AWS --password-stdin ${IMAGE_PREFIX}
# If you need to create a repository for a new adapter it can be done like so:
# aws ecr create-repository --region ${AWS_REGION} --profile ${AWS_PROFILE} --repository-name adapters/${ADAPTER_NAME} || true
docker push ${IMAGE_PREFIX}${ADAPTER_NAME}-adapter:${IMAGE_TAG}

# Start the adapter in the sdlc cluster
yarn qa:adapter start ${ADAPTER_NAME} ${UNIQUE_NAME} ${IMAGE_TAG}
```

To tear down the deployment made above after you are done testing:

```bash
yarn qa:adapter stop ${ADAPTER_NAME} ${UNIQUE_NAME} ${UNIQUE_NAME}
```

To start running a test via Flux Emulator:

```bash
# Use the same unique and adapter name from when you started the adapter
export UNIQUE_NAME=unique-name
export ADAPTER_NAME=coingecko
yarn qa:flux:configure start ${ADAPTER_NAME} ${UNIQUE_NAME}
```

To stop running a test via Flux Emulator:

```bash
yarn qa:flux:configure stop ${ADAPTER_NAME} ${UNIQUE_NAME}
```

To build a K6 payload file from the Flux Emulator config on WeiWatchers:

```bash
yarn qa:flux:configure k6payload ${ADAPTER_NAME} ${UNIQUE_NAME}
```

To start a test using k6 and the generated payload. Note read the k6 readme ./packages/k6/README.md It contains more information on how to configure the test to point to the adapter you have deployed among other things.

```bash
export UNIQUE_NAME=unique
export ADAPTER_NAME=coingecko
# create the config
yarn qa:flux:configure k6payload ${ADAPTER_NAME} ${UNIQUE_NAME}

# Move to the k6 package and build/push
UNIQUE_NAME=${UNIQUE_NAME} ./packages/k6/buildAndPushImage.sh

# start the test pod
UNIQUE_NAME=${UNIQUE_NAME} ADAPTER=${ADAPTER_NAME} ./packages/k6/start.sh
```

To stop or tear down a test using k6 in the cluster do the below.

```bash
UNIQUE_NAME=${UNIQUE_NAME} ADAPTER=${ADAPTER} ./packages/k6/stop.sh
```

When you are done testing please remember to tear down any adapters and k6 deployments in the cluster. If you used the same UNIQUE_NAME for all of the above you can clean up both the adapters and the k6 tests with this:

```bash
PR_NUMBER=${UNIQUE_NAME} ./packages/scripts/src/ephemeral-adapters/cleanup.sh
```

#### Adding Integration Test Fixtures

We use `nock` for intercepting HTTP requests in integration tests and returning mock data.
The [recording](https://github.com/nock/nock#recording) functionality of nock is used when first writing the test to automatically generate accurate fixture data.

For example, take a look at the [synth-index] (./packages/composites/synth-index/test/integration/adapter.test.ts) test to see it in usage. When the `RECORD` environment variable is truthy, nock will proxy HTTP requests and generate fixture data that can be used to contruct the integration test.

The follow steps is the general pattern for writing an integration test.

1. Setup nock to record HTTP requests, see the [synth-index] (./packages/composites/synth-index/test/integration/adapter.test.ts) test for a code sample.
2. Run the test, using live API endpoints for the external adapter under test to hit, with nock recording on.
3. Using the generated fixture data from step 2, setup nock to now intercept HTTP requests and return mock data instead.
4. Now you should have a test that does not do any HTTP requests during execution.

For more information, see the [Jest docs.](https://jestjs.io/docs/cli)

#### Adding Provider API rate limits

When adding a new adapter the tiers from that provider will need to be added to the [static configurations](packages/core/bootstrap/src/lib/provider-limits/limits.json) under the `NAME` given to the adapter.
