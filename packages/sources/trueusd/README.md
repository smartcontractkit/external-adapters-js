# Chainlink External Adapter for TrueUSD

![1.5.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/trueusd/package.json)

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

https://core-api.real-time-attest.trustexplorer.io/trusttoken/TrueUSD

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
    "cacheKey": "kQAHeHapBfNqwyQZWhSsSGx6zIA="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 140,
    "totalToken": 137.87276643,
    "updatedAt": "2022-04-08T14:39:13.724Z",
    "updatedTms": 1649428753724,
    "token": [
      {
        "tokenName": "TUSDB (BNB)",
        "totalTokenbyChain": 76.39276643,
        "totalTrustbyChain": 77,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (TRON)",
        "totalTokenbyChain": 20.22,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (ETH)",
        "totalTokenbyChain": 20.54,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (AVA)",
        "totalTokenbyChain": 20.72,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      }
    ],
    "result": 140
  },
  "result": 140,
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
    "cacheKey": "kQAHeHapBfNqwyQZWhSsSGx6zIA="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 140,
    "totalToken": 137.87276643,
    "updatedAt": "2022-04-08T14:39:13.724Z",
    "updatedTms": 1649428753724,
    "token": [
      {
        "tokenName": "TUSDB (BNB)",
        "totalTokenbyChain": 76.39276643,
        "totalTrustbyChain": 77,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (TRON)",
        "totalTokenbyChain": 20.22,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (ETH)",
        "totalTokenbyChain": 20.54,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (AVA)",
        "totalTokenbyChain": 20.72,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      }
    ],
    "result": 137.87276643
  },
  "result": 137.87276643,
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
    "cacheKey": "6WLGWNlp3Yz32n40twAcGx8Cjx8="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 140,
    "totalToken": 137.87276643,
    "updatedAt": "2022-04-08T14:39:13.724Z",
    "updatedTms": 1649428753724,
    "token": [
      {
        "tokenName": "TUSDB (BNB)",
        "totalTokenbyChain": 76.39276643,
        "totalTrustbyChain": 77,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (TRON)",
        "totalTokenbyChain": 20.22,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (ETH)",
        "totalTokenbyChain": 20.54,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (AVA)",
        "totalTokenbyChain": 20.72,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      }
    ],
    "result": 21
  },
  "result": 21,
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
    "resultPath": "totalTokenbyChain"
  },
  "debug": {
    "cacheKey": "6WLGWNlp3Yz32n40twAcGx8Cjx8="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 140,
    "totalToken": 137.87276643,
    "updatedAt": "2022-04-08T14:39:13.724Z",
    "updatedTms": 1649428753724,
    "token": [
      {
        "tokenName": "TUSDB (BNB)",
        "totalTokenbyChain": 76.39276643,
        "totalTrustbyChain": 77,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (TRON)",
        "totalTokenbyChain": 20.22,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (ETH)",
        "totalTokenbyChain": 20.54,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      },
      {
        "tokenName": "TUSD (AVA)",
        "totalTokenbyChain": 20.72,
        "totalTrustbyChain": 21,
        "bankBalances": [
          {
            "Prime Trust": 1,
            "Silvergate": 2,
            "Signature Bank": 3,
            "First Digital Trust": 4,
            "Customers Bank": 5,
            "Other": 6
          }
        ]
      }
    ],
    "result": 20.72
  },
  "result": 20.72,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
