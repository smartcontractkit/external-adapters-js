# Chainlink External Adapter for Upvest

![1.2.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/upvest/package.json)

Base URL https://fees.upvest.co

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description | Type | Options | Default |
| :-------: | :----------: | :---------: | :--: | :-----: | :-----: |
|           | API_ENDPOINT |             |      |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

Get the current gas price on Ethereum

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |               Options               | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :---------------------------------: | :-----: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `fast`, `fastest`, `medium`, `slow` | `fast`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "gasprice",
    "speed": "fast"
  },
  "debug": {
    "cacheKey": "0BJQ6WrEaARtjkqLfBrRVKG+QcE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "updated": "2021-11-30T15:46:00.048Z",
    "estimates": {
      "fastest": 132.055,
      "fast": 131.363,
      "medium": 113.447,
      "slow": 110.747
    },
    "result": 131.363
  },
  "result": 131.363,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
