# Chainlink External Adapter for TrueUSD

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/trueusd/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.real-time-reserves.ledgerlens.io/v1/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                       Default                        |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://core-api.real-time-attest.trustexplorer.io` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [trueusd](#trueusd-endpoint) | `trueusd` |

## Trueusd Endpoint

https://api.real-time-attest.trustexplorer.io/chainlink/proof-of-reserves/TrueUSD

`trueusd` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                                                   Description                                                    |  Type  | Options |   Default    | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :--------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------: | :--------: | :------------: |
|           | chain |         |                                        Filter data to a single blockchain                                        | string |         |              |            |                |
|           | field |         | The object-path string to parse a single `result` value. When not provided the entire response will be provided. | string |         | `totalTrust` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "field": "totalTrust",
    "endpoint": "trueusd",
    "resultPath": "totalTrust"
  },
  "debug": {
    "cacheKey": "Xjl35TNLr/6IYr18ZLY1HZx9Qq8="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 3117410009.89,
    "totalToken": 3097573780.109635,
    "updatedAt": "2023-06-15T16:59:47.538Z",
    "token": [
      {
        "tokenName": "TUSD (AVAX)",
        "totalTokenByChain": 3005274.95,
        "totalTrustByChain": 24268.83
      },
      {
        "tokenName": "TUSD (ETH)",
        "totalTokenByChain": 728134669.6,
        "totalTrustByChain": 2917383739.66
      },
      {
        "tokenName": "TUSD (TRON)",
        "totalTokenByChain": 2336157454.81,
        "totalTrustByChain": 200002001.4
      },
      {
        "tokenName": "TUSD (BNB)",
        "totalTokenByChain": 145015.86963478,
        "totalTrustByChain": 0
      },
      {
        "tokenName": "TUSD (BSC)",
        "totalTokenByChain": 30131364.88,
        "totalTrustByChain": 0
      }
    ],
    "result": 3117410009.89
  },
  "result": 3117410009.89,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "field": "totalTrust",
    "endpoint": "trueusd",
    "resultPath": "totalToken"
  },
  "debug": {
    "cacheKey": "W4j9iCljgWsL4OTZauhuSChjVQw="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 3117410009.89,
    "totalToken": 3097573780.109635,
    "updatedAt": "2023-06-15T16:59:47.538Z",
    "token": [
      {
        "tokenName": "TUSD (AVAX)",
        "totalTokenByChain": 3005274.95,
        "totalTrustByChain": 24268.83
      },
      {
        "tokenName": "TUSD (ETH)",
        "totalTokenByChain": 728134669.6,
        "totalTrustByChain": 2917383739.66
      },
      {
        "tokenName": "TUSD (TRON)",
        "totalTokenByChain": 2336157454.81,
        "totalTrustByChain": 200002001.4
      },
      {
        "tokenName": "TUSD (BNB)",
        "totalTokenByChain": 145015.86963478,
        "totalTrustByChain": 0
      },
      {
        "tokenName": "TUSD (BSC)",
        "totalTokenByChain": 30131364.88,
        "totalTrustByChain": 0
      }
    ],
    "result": 3097573780.109635
  },
  "result": 3097573780.109635,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "chain": "AVA",
    "field": "totalTrust",
    "endpoint": "trueusd",
    "resultPath": "totalTrust"
  },
  "debug": {
    "cacheKey": "xJmo09VwCgPd+Xy0olMFBYdIkZM="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 3117410009.89,
    "totalToken": 3097573780.109635,
    "updatedAt": "2023-06-15T16:59:47.538Z",
    "token": [
      {
        "tokenName": "TUSD (AVAX)",
        "totalTokenByChain": 3005274.95,
        "totalTrustByChain": 24268.83
      },
      {
        "tokenName": "TUSD (ETH)",
        "totalTokenByChain": 728134669.6,
        "totalTrustByChain": 2917383739.66
      },
      {
        "tokenName": "TUSD (TRON)",
        "totalTokenByChain": 2336157454.81,
        "totalTrustByChain": 200002001.4
      },
      {
        "tokenName": "TUSD (BNB)",
        "totalTokenByChain": 145015.86963478,
        "totalTrustByChain": 0
      },
      {
        "tokenName": "TUSD (BSC)",
        "totalTokenByChain": 30131364.88,
        "totalTrustByChain": 0
      }
    ],
    "result": 24268.83
  },
  "result": 24268.83,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "chain": "TUSD (AVAX)",
    "field": "totalTrust",
    "endpoint": "trueusd",
    "resultPath": "totalTokenByChain"
  },
  "debug": {
    "cacheKey": "A3y8mHxKZ25XLVvzsC4hG7WgVac="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 3117410009.89,
    "totalToken": 3097573780.109635,
    "updatedAt": "2023-06-15T16:59:47.538Z",
    "token": [
      {
        "tokenName": "TUSD (AVAX)",
        "totalTokenByChain": 3005274.95,
        "totalTrustByChain": 24268.83
      },
      {
        "tokenName": "TUSD (ETH)",
        "totalTokenByChain": 728134669.6,
        "totalTrustByChain": 2917383739.66
      },
      {
        "tokenName": "TUSD (TRON)",
        "totalTokenByChain": 2336157454.81,
        "totalTrustByChain": 200002001.4
      },
      {
        "tokenName": "TUSD (BNB)",
        "totalTokenByChain": 145015.86963478,
        "totalTrustByChain": 0
      },
      {
        "tokenName": "TUSD (BSC)",
        "totalTokenByChain": 30131364.88,
        "totalTrustByChain": 0
      }
    ],
    "result": 3005274.95
  },
  "result": 3005274.95,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
