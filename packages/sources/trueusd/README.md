# Chainlink External Adapter for TrueUSD

![1.2.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/trueusd/package.json)

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

https://api.real-time-attest.trustexplorer.io/chainlink/TrueUSD

`trueusd` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                                                   Description                                                    |  Type  | Options |   Default    | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :--------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------: | :--------: | :------------: |
|           | field |         | The object-path string to parse a single `result` value. When not provided the entire response will be provided. | string |         | `totalTrust` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "trueusd",
    "field": "totalTrust"
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
    "totalTrust": 1385192938.49,
    "totalToken": 1373465520.7227664,
    "updatedAt": "2022-04-05T16:45:04.973Z",
    "token": [
      {
        "principle": 5316985.88276643,
        "tokenName": "TUSDB (BNB)"
      },
      {
        "principle": 254336540.22,
        "tokenName": "TUSD (TRON)"
      },
      {
        "principle": 1109418823.8999999,
        "tokenName": "TUSD (ETH)"
      },
      {
        "principle": 4393170.72,
        "tokenName": "TUSD (AVA)"
      }
    ],
    "result": 1385192938.49
  },
  "result": 1385192938.49,
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
    "endpoint": "trueusd",
    "field": "totalToken"
  },
  "debug": {
    "cacheKey": "6Mf4n28MSikPZvECj9Vl7v+OXxM="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "accountName": "TrueUSD",
    "totalTrust": 1385192938.49,
    "totalToken": 1373465520.7227664,
    "updatedAt": "2022-04-05T16:45:04.973Z",
    "token": [
      {
        "principle": 5316985.88276643,
        "tokenName": "TUSDB (BNB)"
      },
      {
        "principle": 254336540.22,
        "tokenName": "TUSD (TRON)"
      },
      {
        "principle": 1109418823.8999999,
        "tokenName": "TUSD (ETH)"
      },
      {
        "principle": 4393170.72,
        "tokenName": "TUSD (AVA)"
      }
    ],
    "result": 1373465520.7227664
  },
  "result": 1373465520.7227664,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
