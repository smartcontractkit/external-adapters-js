# Contributing

Thank you for your interest in improving the Chainlink External Adapter codebase! The steps below support development of original adapters, but you are more than welcome to contribute to existing adapters as well. When opening a PR, please invite `smartcontractkit/solutions-engineering` to review the changes.

## Table of Contents

1. [Creating A New Adapter](#Creating-A-New-Adapter)
2. [Input](#Input)
3. [Output]($Output)
4. [Common Patterns](#Common-Patterns)
5. [Mock Integration Testing](#Mock-Integration-Testing)
6. [Adding Provider API Rate Limits](#Adding-Provider-API-Rate-Limits)

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

```
$ yarn new source my-new-adapter
```

_If on a Mac, this requires `gnu-sed` to be installed and set as the default for the command `sed`._

## Input

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

## Output

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

## Common Patterns

- Use [BigNumber](https://github.com/MikeMcl/bignumber.js/) when operating on large integers
- Use [Decimal.js](https://github.com/MikeMcl/decimal.js/) for all floating point operations. `Decimal.js` uses a precision of 20 by default, but we may lose some precision with really large numbers, so please update to a higher precision before usage:

```
Decimal.set({ precision: 100 })
```

- Handling "includes" in the request should be done with the following priority:
  1. Full-featured "includes" array (in the format of [presetIncludes.json](packages/core/bootstrap/src/lib/external-adapter/overrides/presetIncludes.json))
  2. Pre-set includes from the EA (set in [presetIncludes.json](packages/core/bootstrap/src/lib/external-adapter/overrides/presetIncludes.json))
  3. String array as "includes"

## Mock Integration Testing

We use [Nock](https://github.com/nock/nock) for intercepting HTTP requests in integration tests and returning mock data.
The [recording](https://github.com/nock/nock#recording) functionality of nock is used when first writing the test to automatically generate accurate fixture data.

For example, take a look at the [synth-index] (./packages/composites/synth-index/test/integration/adapter.test.ts) test to see it in usage. When the `RECORD` environment variable is truthy, nock will proxy HTTP requests and generate fixture data that can be used to contruct the integration test.

The follow steps is the general pattern for writing an integration test.

1. Setup nock to record HTTP requests, see the [synth-index] (./packages/composites/synth-index/test/integration/adapter.test.ts) test for a code sample.
2. Run the test, using live API endpoints for the external adapter under test to hit, with nock recording on (`export RECORD=true`).
3. Using the generated fixture data from step 2, write a `fixtures` file to return the mock data instead.
4. Run the tests again with nock recording disabled (`unset RECORD`). API requests should now be intercepted and mocked using the fixture data. Be sure to run tests with the `--updateSnapshot` flags to update the integration snapshot if necessary.

For more information on Jest, see the [Jest docs](https://jestjs.io/docs/cli).

## Adding Provider API Rate Limits

When adding a new adapter the tiers from that provider will need to be added to the [static configurations](packages/core/bootstrap/src/lib/provider-limits/limits.json) under the `NAME` given to the adapter.
