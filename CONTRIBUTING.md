# Contributing

Thank you for your interest in improving the Chainlink External Adapter codebase! The steps below support development of original adapters, but you are more than welcome to contribute to existing adapters as well. When opening a PR, please invite `smartcontractkit/solutions-engineering` to review the changes.

## Table of Contents

1. [Creating A New Adapter](#Creating-A-New-Adapter)
2. [Input](#Input)
3. [Output](#Output)
4. [Adding Provider API Rate Limits](#Adding-Provider-API-Rate-Limits)
5. [Mock Integration Testing](#Mock-Integration-Testing)
6. [Running Integration Tests](#Running-Integration-Tests)
7. [Generating Changesets](#Generating-Changesets)
8. [Common Patterns](#Common-Patterns)
9. [Soak Testing (Chainlink Labs)](<#Soak-Testing-(Chainlink-Labs)>)
10. [Logging Censorship](#logging-censorship)
11. [Framework Development](#framework-development)

## Creating A New Adapter

To get started use the `new` script with one argument:

```bash
$ yarn new [template-type]
```

This will start interactive command line interface, where you can provide additional information.

|    Parameter    |           Description           |             Options             | Default  |
| :-------------: | :-----------------------------: | :-----------------------------: | :------: |
| `template-type` | the name of the template to use | `composite`, `source`, `target` | `source` |

For example

```bash
$ yarn new source
```

You can open a PR with the [New EA PR Template](./.github/PULL_REQUEST_TEMPLATE/new_ea_pr_template.md) by replacing `<branch>` in this URL: [https://github.com/smartcontractkit/external-adapters-js/compare/main...<branch>?quick_pull=1&template=new_ea_pr_template.md](https://github.com/smartcontractkit/external-adapters-js/compare/main...<branch>?quick_pull=1&template=new_ea_pr_template.md)

Please refer to this [guide](https://github.com/smartcontractkit/ea-framework-js/blob/main/docs/guides/creating-a-new-v3-ea.md) that explains in more detail how to create a new adapter.

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

## Adding Provider API Rate Limits

When adding a new adapter, the tiers from that provider will need to be added to the Adapter class as a [parameter](https://github.com/smartcontractkit/ea-framework-js/blob/main/docs/components/adapter.md#rate-limiting-tiers).

## Mock Integration Testing

We use [Nock](https://github.com/nock/nock) for intercepting HTTP requests in integration tests and returning mock data.
To create a fixture, you'll need to make a real request to the data provider's API.

### Testing HTTP Requests

1. Setup the test, see the [coingecko](./packages/sources/coingecko/test/integration/adapter.test.ts) test for a code sample.
2. Make a request to the Data Provider and copy the response. For HTTP requests, you can use tools like `curl`. Change/mock any sensitive data that it contains.
3. Using the mock data from step 2, write a `fixtures.ts` file to return the mock data instead.
4. Run the tests. API requests should now be intercepted and mocked using the fixture data.

### Testing WebSocket Messages

1. Setup the test, see the [ncfx](./packages/sources/ncfx/test/integration/adapter.test.ts) test for a code sample.
2. Connect and send an authentication message request to Data Provider. Change/mock any sensitive data in the response and copy it. For websocket requests, you can use tools like [wscat](https://github.com/websockets/wscat).
3. Make a request to the Data Provider to fetch actual data, and copy the websocket messages. Change/mock any sensitive data that it contains.
4. Using the copied messages in step 2 and 3, write a `fixtures.ts` file. Create mock function in `fixtures.ts` that will return mocked authentication and data messages. See [ncfx test fixtures example](./packages/sources/ncfx/test/integration/fixtures.ts).
5. Run the tests. Websocket requests should now be intercepted and mocked using the fixture data.

For more information on Jest, see the [Jest docs](https://jestjs.io/docs/cli).

For more information on how to write integration tests, see [ea-framework-js docs](https://github.com/smartcontractkit/ea-framework-js/blob/main/docs/components/tests.md).

### Testing on-chain contracts

There are generally two ways to mock the request and response from ether.js

1. You can mock the library itself, see [example](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/alpine/test/integration/adapter.test.ts#L5)
2. Or you can mock the actual underlying request/response. You do that by logging the request and response of a real call and use them as your mock objects, see [example](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/trumatic-matic-exchange-rate/test/integration/fixtures.ts)

You would need to replace `ethers.providers.JsonRpcProvider` with

```
class LoggingProvider extends ethers.providers.JsonRpcProvider {
    send(method: string, parameters: any): Promise<any> {
        console.log(">>>", method, parameters);
        return super.send(method, parameters).then((result) => {
            console.log("<<<", result);
            return result;
        });
    }
}
```

Then you can spin up the EA with real request and get the request and response objects.

## Generating Changesets

When making changes to an adapter, a changeset should be added for each feature or bug fix introduced. For each "unit" of changes, follow these steps to determine the packages affected, the version upgrade, and finally the changelog text. If you make a mistake, simply delete the files created in `.changeset/` and try again:

1. Run `yarn changeset` (from the root directory) to open a list of packages. You can filter packages by typing a string to match part of a package name (ex. type `coinm` to match `@chainlink/coinmarketcap-adapter` and `@chainlink/coinmetrics-adapter`). Use the `up` and `down` arrows to traverse the list and use `space` to select and unselect packages.
2. After selecting all packages affected by your change, press `enter` to determine the version level change for each package. Use `up`, `down`, and `space` to select the packages for each level of change, using `enter` to move through each level. This starts with `Major`, then goes to `Minor`, then any remaining unselected packages will have `Patch` applied.
3. In the final step, add a text summary that will be added to the `CHANGELOG.md` for every package when changesets are consumed.
4. Once the files in `.changeset/` have been created, add them to your branch to include them in the final PR.

## Common Patterns

- Use [BigNumber](https://github.com/MikeMcl/bignumber.js/) when operating on large integers
- Use [Decimal.js](https://github.com/MikeMcl/decimal.js/) for all floating point operations. `Decimal.js` uses a precision of 20 by default, but we may lose some precision with really large numbers, so please update to a higher precision before usage:

```js
Decimal.set({ precision: 100 })
```

## Soak Testing (Chainlink Labs)

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
export MASTER_CONFIG=url
yarn qa:flux:configure start ${ADAPTER_NAME} ${UNIQUE_NAME}
```

To stop running a test via Flux Emulator:

```bash
yarn qa:flux:configure stop ${ADAPTER_NAME} ${UNIQUE_NAME}
```

To build a K6 payload file from the Flux Emulator config using test-payload.json files:

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

### Output testing

Soak testing additionally can test the responses output. The output testing runs against assertions placed in `./packages/k6/src/config/assertions`. Common assertions are in `assertions.json`, adapter-specific ones will be loaded from `${adapterName}-assertions.json`. Assertions can be applied for all the requests or specific set of parameters. See examples in the folder.

The output testing checks the variety of input parameters, should be at least 10. For new adapters various parameters should be defined in `test-payload.json`.

Input parameters in `test-payload.json` should include the following pairs:

**High/low volume pairs**

```
[{"from": "OGN", "to": "ETH"}, {"from": "CSPR", "to": "USD"}, {"from": "CTSI", "to": "ETH"}, {"from": "BADGER", "to": "ETH"}, {"from": "BADGER", "to": "USD"}, {"from": "BSW", "to": "USD"}, {"from": "KNC", "to": "USD"}, {"from": "KNC", "to": "USD"}, {"from": "QUICK", "to": "ETH"}, {"from": "QUICK", "to": "USD"}, {"from": "FIS", "to": "USD"}, {"from": "MBOX", "to": "USD"}, {"from": "FOR", "to": "USD"}, {"from": "DGB", "to": "USD"}, {"from": "SUSD", "to": "ETH"}, {"from": "SUSD", "to": "USD"}, {"from": "WIN", "to": "USD"}, {"from": "SRM", "to": "ETH"}, {"from": "SRM", "to": "USD"}, {"from": "ALCX", "to": "ETH"}, {"from": "ALCX", "to": "USD"}, {"from": "ADX", "to": "USD"}, {"from": "NEXO", "to": "USD"}, {"from": "ANT", "to": "ETH"}, {"from": "ANT", "to": "USD"}, {"from": "LOOKS", "to": "USD"}, {"from": "WNXM", "to": "USD"}, {"from": "MDX", "to": "USD"}, {"from": "ALPHA", "to": "BNB"}, {"from": "ALPHA", "to": "USD"}, {"from": "NMR", "to": "ETH"}, {"from": "NMR", "to": "USD"}, {"from": "PHA", "to": "USD"}, {"from": "OHM", "to": "ETH"}, {"from": "BAL", "to": "ETH"}, {"from": "BAL", "to": "USD"}, {"from": "CVX", "to": "USD"}, {"from": "MOVR", "to": "USD"}, {"from": "DEGO", "to": "USD"}, {"from": "USDD", "to": "USD"}, {"from": "QI", "to": "USD"}, {"from": "MIM", "to": "USD"}, {"from": "KP3R", "to": "ETH"}, {"from": "REP", "to": "ETH"}, {"from": "REP", "to": "USD"}, {"from": "WING", "to": "USD"}, {"from": "XVS", "to": "BNB"}, {"from": "XVS", "to": "USD"}, {"from": "BOND", "to": "ETH"}, {"from": "BOND", "to": "USD"}, {"from": "REQ", "to": "USD"}, {"from": "LEO", "to": "USD"}, {"from": "ORN", "to": "ETH"}, {"from": "ALPACA", "to": "USD"}, {"from": "AGEUR", "to": "USD"}, {"from": "VAI", "to": "USD"}, {"from": "BIFI", "to": "USD"}, {"from": "AUTO", "to": "USD"}, {"from": "CEL", "to": "ETH"}, {"from": "CEL", "to": "USD"}, {"from": "HT", "to": "USD"}, {"from": "GLM", "to": "USD"}, {"from": "OM", "to": "USD"}, {"from": "BIT", "to": "USD"}, {"from": "ERN", "to": "USD"}, {"from": "PLA", "to": "USD"}, {"from": "FARM", "to": "ETH"}, {"from": "FARM", "to": "USD"}, {"from": "FORTH", "to": "USD"}, {"from": "OXT", "to": "USD"}, {"from": "MLN", "to": "ETH"}, {"from": "MLN", "to": "USD"}, {"from": "ONG", "to": "USD"}, {"from": "GUSD", "to": "ETH"}, {"from": "GUSD", "to": "USD"}, {"from": "DFI", "to": "USD"}, {"from": "SWAP", "to": "ETH"}, {"from": "ALUD", "to": "USD"}, {"from": "CREAM", "to": "BNB"}, {"from": "CREAM", "to": "USD"}, {"from": "GNO", "to": "ETH"}, {"from": "XAVA", "to": "USD"}, {"from": "BOO", "to": "USD"}, {"from": "AMPL", "to": "USD"}, {"from": "AMPL", "to": "USD"}, {"from": "RAI", "to": "ETH"}, {"from": "RAI", "to": "USD"}, {"from": "FEI", "to": "ETH"}, {"from": "FEI", "to": "USD"}, {"from": "DPX", "to": "USD"}, {"from": "EURT", "to": "USD"}, {"from": "LON", "to": "ETH"}, {"from": "BORING", "to": "BNB"}, {"from": "BORING", "to": "USD"}, {"from": "RARI", "to": "ETH"}, {"from": "DNT", "to": "ETH"}, {"from": "FOX", "to": "USD"}, {"from": "XHV", "to": "USD"}, {"from": "TRIBE", "to": "ETH"}, {"from": "UMEE", "to": "ETH"}, {"from": "UST", "to": "ETH"}, {"from": "UST", "to": "USD"}, {"from": "ZCN", "to": "USD"}, {"from": "DPI", "to": "USD"}]
```

**Collision risks**

```
[{"from": "MIM", "to": "USD"}, {"from": "LRC", "to": "USD"}, {"from": "OHM", "to": "USD"}, {"from": "QUICK", "to": "USD"}]
```

**Forex feeds**

```
[{"from": "AED", "to": "USD"}, {"from": "AUD", "to": "USD"}, {"from": "BRL", "to": "USD"}, {"from": "CAD", "to": "USD"}, {"from": "CHF", "to": "USD"}, {"from": "CNY", "to": "USD"}, {"from": "COP", "to": "USD"}, {"from": "CZK", "to": "USD"}, {"from": "EUR", "to": "USD"}, {"from": "GBP", "to": "USD"}, {"from": "HKD", "to": "USD"}, {"from": "IDR", "to": "USD"}, {"from": "ILS", "to": "USD"}, {"from": "INR", "to": "USD"}, {"from": "JPY", "to": "USD"}, {"from": "KRW", "to": "USD"}, {"from": "MXN", "to": "USD"}, {"from": "NZD", "to": "USD"}, {"from": "PHP", "to": "USD"}, {"from": "PLN", "to": "USD"}, {"from": "SEK", "to": "USD"}, {"from": "SGD", "to": "USD"}, {"from": "THB", "to": "USD"}, {"from": "TRY", "to": "USD"}, {"from": "TZS", "to": "USD"}, {"from": "VND", "to": "USD"}, {"from": "XAG", "to": "USD"}, {"from": "XAU", "to": "USD"}, {"from": "XPT", "to": "USD"}, {"from": "ZAR", "to": "USD"}, {"from": "ZEC", "to": "USD"}, {"from": "ZIL", "to": "USD"}, {"from": "ZRX", "to": "ETH"}, {"from": "ZRX", "to": "USD"}]
```

Available types of assertions:

- `minPrecision` - minimum precision for a numeric value
- `greaterThan` - minimum numeric value
- `lessThan` - maximum numeric value
- `minItems` - list contains at least the required number of items
- `contains` - list contains a specific item (string or number)
- `hasKey` - an object contains a specific key

## Framework Development

Any new EAs should be developed using the [EA Framework](https://github.com/smartcontractkit/ea-framework-js) for base classes. Follow these steps if you would like to test changes to the EA Framework:

1. Clone [external-adapters-js](https://github.com/smartcontractkit/external-adapters-js) and [ea-framework-js](https://github.com/smartcontractkit/ea-framework-js):

```bash
~ git clone https://github.com/smartcontractkit/external-adapters-js.git
~ git clone https://github.com/smartcontractkit/ea-framework-js.git
```

2. Create the portal:

```bash
~ cd ea-framework-js/ && yarn portal-path
```

3. Replace the current version of the framework in `package.json` of a given adapter with the portal path printed in the previous step. For example:

```json
    "@chainlink/external-adapter-framework": "1.0.0",
    // -->
    "@chainlink/external-adapter-framework": "portal:/Users/username/ea-framework-js/dist/src",
```

4. Make the desired changes to `ea-framework-js` and rebuild:

```bash
~/ea-framework-js yarn build
```

6. Run the desired adapter to test:

```bash
~/ea-framework-js cd ../external-adapters-js/ && yarn && yarn setup && cd packages/sources/<adapter>
~/external-adapters-js/packages/sources/<adapter> yarn start
```
