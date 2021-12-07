# Contributing

Thank you for your interest in improving the Chainlink External Adapter codebase! The steps below support development of original adapters, but you are more than welcome to contribute to existing adapters as well. When opening a PR, please invite `smartcontractkit/solutions-engineering` to review the changes.

## Table of Contents

1. [Creating A New Adapter](#Creating-A-New-Adapter)
2. [Input](#Input)
3. [Output](#Output)
4. [Common Patterns](#Common-Patterns)
5. [Mock Integration Testing](#Mock-Integration-Testing)
6. [Soak Testing (Chainlink Team only)](<#Soak-Testing-(Chainlink-Team-only)>)
7. [Adding Provider API Rate Limits](#Adding-Provider-API-Rate-Limits)

## Creating A New Adapter

To get started from one of the example adapters seen in [examples](./packages/examples) use the `new` script with two arguments:

```bash
$ yarn new [template-type] [name-of-adapter]
```

|     Parameter     |           Description           |        Options        |
| :---------------: | :-----------------------------: | :-------------------: |
|  `template-type`  | the name of the template to use | `composite`, `source` |
| `name-of-adapter` |  what to call the new adapter   |     user-defined      |

For example

```bash
$ yarn new source my-new-adapter
```

_If on a Mac, this requires `gnu-sed` to be installed and set as the default for the command `sed`._

## Input

When flux monitor or OCR jobs from the core Chainlink node post to external adapters, the request body looks as follows:

```js
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

## Output

The External Adapter will do some processing, often request data from an API, and return the following response structure:

```js
  {
    "jobRunID": "2cae6a10e5184aa685c3428964b02418",
    "statusCode": 200,
    "data": {
      "result": 3000 // Result for Flux Monitor jobs.
      // ... Response data
    },
    "result": 3000, // Result for OCR jobs.
    "maxAge": 222, // [OPTIONAL] metadata for how long the request is cached for
    "debug": { // [OPTIONAL]
      // Additional metadata from the EA framework used for tracking metrics
    }
  }
```

## Common Patterns

- Use [BigNumber](https://github.com/MikeMcl/bignumber.js/) when operating on large integers
- Use [Decimal.js](https://github.com/MikeMcl/decimal.js/) for all floating point operations. `Decimal.js` uses a precision of 20 by default, but we may lose some precision with really large numbers, so please update to a higher precision before usage:

```js
Decimal.set({ precision: 100 })
```

- Handling "includes" in the request should be done with the following priority:
  1. Full-featured "includes" array (in the format of [presetIncludes.json](packages/core/bootstrap/src/lib/external-adapter/overrides/presetIncludes.json))
  2. Pre-set includes from the EA (set in [presetIncludes.json](packages/core/bootstrap/src/lib/external-adapter/overrides/presetIncludes.json))
  3. String array as "includes"

## Mock Integration Testing

We use [Nock](https://github.com/nock/nock) for intercepting HTTP requests in integration tests and returning mock data.
The [recording](https://github.com/nock/nock#recording) functionality of nock is used when first writing the test to automatically generate accurate fixture data.

For example, take a look at the [synth-index](./packages/composites/synth-index/test/integration/adapter.test.ts) test to see it in usage. When the `RECORD` environment variable is truthy, nock will proxy HTTP requests and generate fixture data that can be used to contruct the integration test.

The follow steps is the general pattern for writing an integration test.

1. Setup nock to record HTTP requests, see the [synth-index](./packages/composites/synth-index/test/integration/adapter.test.ts) test for a code sample.
2. Run the test, using live API endpoints for the external adapter under test to hit, with nock recording on (`export RECORD=true`).
3. Using the generated fixture data from step 2, write a `fixtures.ts` file to return the mock data instead.
4. Run the tests again with nock recording disabled (`unset RECORD`). API requests should now be intercepted and mocked using the fixture data. Be sure to run tests with the `--updateSnapshot` flags to update the integration snapshot if necessary.

For more information on Jest, see the [Jest docs](https://jestjs.io/docs/cli).

## Soak Testing (Chainlink Team only)

In order to soak test adapters we need to create and push the adapter out to the sdlc cluster. From there we can use the Flux Emulator or K6 to send traffic to it for the amount of time you need.

Prerequisites to starting an external adapter in the sdlc cluster

1. You must be on the vpn to access the k8s cluster.
2. You must have your kubeconfig set to the sdlc cluster which also requires you be logged into the aws secure-sdlc account as a user with k8s permissions. To do so it would look something like this but with your specific profile name `aws sso login --profile sdlc`. Instructions to set this up and set your kubeconfig can be found in [QA Kubernetes Cluster](https://www.notion.so/chainlink/QA-Kubernetes-Cluster-ca3f1a64e6fd4476ac5a76c8bfcd8624)
3. In order to pull the external adapter helm chart you need to have a GitHub PAT and add the chainlik helm repo using the instructions in [smartcontractkit/charts](https://github.com/smartcontractkit/charts)

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

## Adding Provider API Rate Limits

When adding a new adapter the tiers from that provider will need to be added to the [static configurations](packages/core/bootstrap/src/lib/provider-limits/limits.json) under the `NAME` given to the adapter.
