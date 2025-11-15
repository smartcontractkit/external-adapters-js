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
9. [Logging Censorship](#logging-censorship)
10. [Framework Development](#framework-development)

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
