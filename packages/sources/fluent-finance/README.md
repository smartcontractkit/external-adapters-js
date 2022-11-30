# Fluent Finance Adapter

![1.1.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/fluent-finance/package.json)

Fluent Finance Adapter for retrieving bank balances

Base URL https://gateway-api.fluent.finance/v1/gateway/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [moon](#moon-endpoint) | `moon`  |

## Moon Endpoint

Bank balances for moonbeam

`moon` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "moon",
    "resultPath": "availableBalance"
  },
  "debug": {
    "cacheKey": "Ia1T4Y2aYiMx+maKLg0MrmqC3UE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "number": "9000000003481",
        "name": "*Checking Account*",
        "type": "SAVINGS",
        "balance": 24681.55,
        "availableBalance": 24681.55,
        "active": true,
        "currencyCode": "USD"
      },
      {
        "number": "9000000003482",
        "name": "*Checking Account*",
        "type": "SAVINGS",
        "balance": 0,
        "availableBalance": 0,
        "active": true,
        "currencyCode": "USD"
      }
    ],
    "result": 24681.55
  },
  "result": 24681.55,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
