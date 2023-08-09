# Chainlink External Adapters (TypeScript)

This repository contains the source code for Chainlink external adapters. If you would like to contribute, please see the [Contributing](./CONTRIBUTING.md) page for more details.

## Table of Contents

1. [Getting Started](#Getting-Started)
2. [How to Run](#How-to-Run)
3. [Testing](#Testing)
4. [Deployment](#Deployment)
5. [EA Versioning](#External-Adapters-Versioning)
6. [Advanced Features](#Advanced-Features)

## Getting Started

### Requirements

- Node.js v16
- Yarn

### Install

```sh
yarn
```

Installs the dependencies for all workspaces.

### Setup

```sh
yarn setup
```

Runs the setup step for all adapters. Typically this step just compiles TypeScript, but may involve other tasks.

### Clean

```sh
yarn clean
```

Clears all build files/directories. Useful in case of issues when installing dependencies or running setup.

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
    ╠══ scripts - additional Node.js scripts for mono-repository management
    ║
    ╠══ sources - adapters that read data from a data provider's API.
    ║
    ╚══ targets - adapters that write data to a location, often a blockchain.
```

## How to Run

External adapters should be run as long-lived processes, either directly as [HTTP Server](#run-as-http-server), [Docker Container](#run-as-docker-container), or [Single-Command Docker App](#single-command-docker-app). Each adapter may have configuration that is required to be supplied through environment variables.

### Configuration

There may be required environment variables that must be provided to run an External Adapter. Please see the respective adapter's README for more specific information on the External Adapter that you would like to run.

Every External Adapter has some optional environment variables for customizing behavior and turning on advanced features. More documentation for these can be seen [here](./packages/core/bootstrap/README.md).

### Run as HTTP server

Use the start command while in the directory of the adapter that you would like to run. For example:

```sh
cd packages/sources/coingecko
yarn start
```

### Run as Docker Container

1. All of the external-adapters have a service that is created when the repo's docker-compose file is generated.

This can be done by running the following command in the root of the repository (after `yarn && yarn setup`):

```sh
yarn generate:docker-compose
```

2. Next create a container image. Use the generated `docker-compose.generated.yaml` file along with `docker-compose build`.

```sh
docker-compose -f docker-compose.generated.yaml build [adapter-name]
```

Where `[adapter-name]` is replaced with the following:

|   Parameter    |                                        Description                                        |                                       Options                                        |
| :------------: | :---------------------------------------------------------------------------------------: | :----------------------------------------------------------------------------------: |
| `adapter-name` | name of the external adapter package, usually the folder name with `-adapter` as a suffix | See `docker-compose.generated.yaml` for list of services that can be used as options |

For example the `bravenewcoin` external adapter uses `bravenewcoin-adapter`:

```sh
docker-compose -f docker-compose.generated.yaml build bravenewcoin-adapter
```

3. Then run it with:

```sh
docker-compose -f docker-compose.generated.yaml run -p 8080:8080 -e API_KEY='YOUR_API_KEY' bravenewcoin-adapter
```

Environment files can also be passed through a file:

```
docker run -p 8080:8080 --env-file="~/PATH_TO_ENV" -it proof-of-reserves-adapter:latest
```

### Single-Command Docker App

This command will start all of your external adapters with performance features enabled and with pre-defined metrics charts for each EA on a single server.

The first step will be to load up all of the environment variables that are needed across all of the External Adapters that will be ran. These can either be already be loaded into the environment or supplied to the startup script as a text file.
Also make sure that [Grafana dependencies](./grafana/README.md#deployment) are installed.

Starting from the root of the repository:

1. Ensure that the project is setup and that the docker-compose file has been generated

```sh
yarn && yarn setup && yarn generate:docker-compose
```

2. Use the startup script by supplying every External Adapter that you would like to run and monitor.

The adapter will have the format of `[[ADAPTER NAME]]-adapter`.

For example:

```sh
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
      package: '@chainlink/coincodex-adapter'
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

## Testing

In order to test adapters locally, you may need to set environment variables such as `$API_KEY`. These can be found in the `README.md` for every adapter.

When running integration tests make sure that metrics are disabled (`export METRICS_ENABLED=false`) and EA server is running on random available port (`export EA_PORT=0`).

Make sure you run these commands from the ROOT of this monorepo.

```sh
# Build all packages
yarn setup

# Run all unit tests
yarn test:unit

# Run all integration tests
yarn test:integration

export adapter=myadapter # Your adapter name, coinmarketcap, coingecko, etc

# Run integration tests for that adapter
yarn test $adapter/test/integration

# Run unit tests for that adapter
yarn test $adapter/test/unit

# Run a specific test for that adapter
yarn test $adapter/test/unit/my-specific-test.test.ts

# Run a tests in watch mode, re-running tests that have code changes or dependency changes in them
yarn test --watch $adapter/test/unit
```

## Deployment

### Container Images

Images are being published to Chainlink's public AWS ECR repositories:
`public.ecr.aws/chainlink/adapters`

They can also be found in the public gallery, the registry name is `chainlink` (e.g. `https://gallery.ecr.aws/chainlink/adapters/1forge-adapter`).

The External Adapters are being tagged with semantic releases to allow for automated upgrades.

### Running from ECR

The EA container image can be download by using the [docker pull command](https://docs.docker.com/engine/reference/commandline/pull/). For example:

```sh
docker pull public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

To run the image use the [docker run command](https://docs.docker.com/engine/reference/run/). For example:

```sh
docker run -p 8080:8080 -e API_KEY='YOUR_API_KEY' public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

It can be helpful to pass a text file to the container to handle giving multiple environment variables:

```sh
docker run -p 8080:8080 --env-file=[[path to your env file]] public.ecr.aws/chainlink/adapters/1forge-adapter:latest
```

## External Adapters Versioning

For a full rundown on how versioning works, see [semver](https://semver.org/).

What you need to know is that we make releases with the following versioning scheme: _major.minor.patch_.

- A _patch_ version change usually has small changes/bug fixes. Upgrading/downgrading the _patch_ version number should never break compatibility.
- A _minor_ version change usually adds functionality. Upgrading should never break compatibility, but you might not be able to downgrade the _minor_ version.
- A _major_ version change usually introduces a breaking change. Both upgrading and downgrading the _major_ version number might require additional work. **Proceed with caution!**

Best practice is to try to always keep it up to date!

### Why do the versions jump up sometimes?

Sometimes when looking at the releases for an EA you might see it jumped a version number. For example, the previous release might be 1.2.3 and then the next release is 1.2.5. The reason being is that each week we publish a new release. Whenever we make a change it includes a [changeset](https://github.com/changesets/changesets), which uses versioning semantics above (major, minor, and patch). Sometimes over the course of a given week, more than one changes are included in an adapter, so more than one changeset gets ingested into the release, thus causing the release number to jump. So if a version went from 1.2.3 to 1.2.5, that means two patches were pushed that week.

## Advanced Features

<details>
<summary>Performance and Caching</summary>

The following section details mechanisms that reduce the number of API calls made from external adapters. It is highly recommended to turn on the following three middlewares.

#### Caching

Caching allows for the EA to store successful responses and facilitate faster future response times. See [here](./packages/core/bootstrap/README.md#caching) for more information.

> ### ⚠️ Note
>
> Please check and ensure caching is allowed and not in violation of the Terms of Service of the data provider's API. Disable caching flags if it is not supported by the specified API provider's TOS.

Caching is enabled by default. It can be turned off using:

```sh
export CACHE_ENABLED=false
```

#### Rate Limiting

The Rate Limit middleware prevents hitting rate limit issues with data providers. This is done by adjusting how long a request lives in the cache based on the available capacity of your API subscription plan. The cache must be enabled to use this middleware. See [here](./packages/core/bootstrap/README.md#rate-limit) for more information.

Rate Limiting is enabled by default. It can be turned off using:

```sh
export RATE_LIMIT_ENABLED=false
```

There are two options for defining API subscription capacity:

1. Manual setting (example shown for limit at 10 requests/minute)

```sh
export RATE_LIMIT_CAPACITY=60
```

2. Limits by provider data (example for Coingecko free tier)

```sh
export RATE_LIMIT_API_PROVIDER=coingecko RATE_LIMIT_API_TIER=free
```

The `RATE_LIMIT_API_PROVIDER` environment variable is optional as when not given it will derive from the running adapter.

Preset tiers/plans can be found [here](./packages/core/bootstrap/src/lib/provider-limits/limits.json) and use the corresponding `provider` and `tierName`.

#### Cache Warming

When a new unique request comes in to an EA the Cache Warming middleware will begin polling the API on an interval ensure that data is always ready to be served and is as fresh as possible. The cache must be enabled to use this middleware. See [here](./packages/core/bootstrap/README.md#cache-warmer) for more information.

Cache Warming is enabled by default. It can be turned off using:

```sh
export WARMUP_ENABLED=false
```

The cache will begin polling once the first request has been received.
It will also attempt to use batch requests to save API credits when possible.

</details>

<details>
<summary>Multiple API Key Support</summary>

In order to use multiple API keys for an adapter, simply comma delimit the keys where you define the environment variable. This will work for an arbitrary number of keys.

```sh
export API_KEY=myapikey1,myapikey2,myapikey3
```

The external adapter will then randomly rotate the keys. Over time this should balance out the number of requests between each of the API keys.

</details>

<details>
<summary>Bridge URL Query String Parameters</summary>

Additional input parameters can be passed to an External Adapter through the Bridge URL that is specified when connecting an External Adapter to the core node.

This is useful in scenarios where when running multiple External Adapters to service a job spec there is a single External Adapter's behavior needs to be customized without affecting the others.

</details>

<details>
<summary>Ticker Overrides</summary>

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

</details>
