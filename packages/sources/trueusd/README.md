# Chainlink External Adapter for TrueUSD

![1.6.20](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/trueusd/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.real-time-attest.trustexplorer.io

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
    "totalTrust": 1217813909.066,
    "totalToken": 1213602213.6176918,
    "updatedAt": "2022-08-10T14:22:39.011Z",
    "token": [
      {
        "tokenName": "TUSD (AVAX)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1794,
          "Silvergate": 0,
          "Signature Bank": 0,
          "Signet": 0,
          "Other": 1
        },
        "totalTokenByChain": 3791570.06,
        "totalTrustByChain": 1795
      },
      {
        "tokenName": "TUSD (ETH)",
        "bankBalances": {
          "Prime Trust": 134055616.61,
          "BitGo": 16.12,
          "First Digital Trust": 594966145.326,
          "Silvergate": 113846225.15,
          "Signature Bank": 0,
          "Signet": 274940619.86,
          "Customers Bank": 100000000
        },
        "totalTokenByChain": 879902244.54,
        "totalTrustByChain": 1217808623.066
      },
      {
        "tokenName": "TUSD (TRON)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1600,
          "Silvergate": 0,
          "Signature Bank": 0,
          "Signet": 0
        },
        "totalTokenByChain": 329515277.3,
        "totalTrustByChain": 1600
      },
      {
        "tokenName": "TUSD (BNB)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1891,
          "Signature Bank": 0,
          "Signet": 0
        },
        "totalTokenByChain": 393121.7176917,
        "totalTrustByChain": 1891
      }
    ],
    "result": 1217813909.066
  },
  "result": 1217813909.066,
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
    "totalTrust": 1217813909.066,
    "totalToken": 1213602213.6176918,
    "updatedAt": "2022-08-10T14:22:39.011Z",
    "token": [
      {
        "tokenName": "TUSD (AVAX)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1794,
          "Silvergate": 0,
          "Signature Bank": 0,
          "Signet": 0,
          "Other": 1
        },
        "totalTokenByChain": 3791570.06,
        "totalTrustByChain": 1795
      },
      {
        "tokenName": "TUSD (ETH)",
        "bankBalances": {
          "Prime Trust": 134055616.61,
          "BitGo": 16.12,
          "First Digital Trust": 594966145.326,
          "Silvergate": 113846225.15,
          "Signature Bank": 0,
          "Signet": 274940619.86,
          "Customers Bank": 100000000
        },
        "totalTokenByChain": 879902244.54,
        "totalTrustByChain": 1217808623.066
      },
      {
        "tokenName": "TUSD (TRON)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1600,
          "Silvergate": 0,
          "Signature Bank": 0,
          "Signet": 0
        },
        "totalTokenByChain": 329515277.3,
        "totalTrustByChain": 1600
      },
      {
        "tokenName": "TUSD (BNB)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1891,
          "Signature Bank": 0,
          "Signet": 0
        },
        "totalTokenByChain": 393121.7176917,
        "totalTrustByChain": 1891
      }
    ],
    "result": 1213602213.6176918
  },
  "result": 1213602213.6176918,
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
    "totalTrust": 1217813909.066,
    "totalToken": 1213602213.6176918,
    "updatedAt": "2022-08-10T14:22:39.011Z",
    "token": [
      {
        "tokenName": "TUSD (AVAX)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1794,
          "Silvergate": 0,
          "Signature Bank": 0,
          "Signet": 0,
          "Other": 1
        },
        "totalTokenByChain": 3791570.06,
        "totalTrustByChain": 1795
      },
      {
        "tokenName": "TUSD (ETH)",
        "bankBalances": {
          "Prime Trust": 134055616.61,
          "BitGo": 16.12,
          "First Digital Trust": 594966145.326,
          "Silvergate": 113846225.15,
          "Signature Bank": 0,
          "Signet": 274940619.86,
          "Customers Bank": 100000000
        },
        "totalTokenByChain": 879902244.54,
        "totalTrustByChain": 1217808623.066
      },
      {
        "tokenName": "TUSD (TRON)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1600,
          "Silvergate": 0,
          "Signature Bank": 0,
          "Signet": 0
        },
        "totalTokenByChain": 329515277.3,
        "totalTrustByChain": 1600
      },
      {
        "tokenName": "TUSD (BNB)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1891,
          "Signature Bank": 0,
          "Signet": 0
        },
        "totalTokenByChain": 393121.7176917,
        "totalTrustByChain": 1891
      }
    ],
    "result": 1795
  },
  "result": 1795,
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
    "totalTrust": 1217813909.066,
    "totalToken": 1213602213.6176918,
    "updatedAt": "2022-08-10T14:22:39.011Z",
    "token": [
      {
        "tokenName": "TUSD (AVAX)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1794,
          "Silvergate": 0,
          "Signature Bank": 0,
          "Signet": 0,
          "Other": 1
        },
        "totalTokenByChain": 3791570.06,
        "totalTrustByChain": 1795
      },
      {
        "tokenName": "TUSD (ETH)",
        "bankBalances": {
          "Prime Trust": 134055616.61,
          "BitGo": 16.12,
          "First Digital Trust": 594966145.326,
          "Silvergate": 113846225.15,
          "Signature Bank": 0,
          "Signet": 274940619.86,
          "Customers Bank": 100000000
        },
        "totalTokenByChain": 879902244.54,
        "totalTrustByChain": 1217808623.066
      },
      {
        "tokenName": "TUSD (TRON)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1600,
          "Silvergate": 0,
          "Signature Bank": 0,
          "Signet": 0
        },
        "totalTokenByChain": 329515277.3,
        "totalTrustByChain": 1600
      },
      {
        "tokenName": "TUSD (BNB)",
        "bankBalances": {
          "Prime Trust": 0,
          "First Digital Trust": 1891,
          "Signature Bank": 0,
          "Signet": 0
        },
        "totalTokenByChain": 393121.7176917,
        "totalTrustByChain": 1891
      }
    ],
    "result": 3791570.06
  },
  "result": 3791570.06,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
