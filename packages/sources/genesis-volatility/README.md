# Chainlink External Adapter for Genesis Volatility

![1.3.33](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/genesis-volatility/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://app.pinkswantrading.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |             Description             |  Type  | Options |              Default              |
| :-------: | :----------: | :---------------------------------: | :----: | :-----: | :-------------------------------: |
|    ✅     |   API_KEY    | Your API key for Genesis Volatility | string |         |                                   |
|           | API_ENDPOINT |                                     | string |         | `https://app.pinkswantrading.com` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [volatility](#volatility-endpoint) | `volatility` |

## Volatility Endpoint

`volatility` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |          Aliases          |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |  `base`, `coin`, `from`   | The symbol of the currency to query | string |         |         |            |                |
|    ✅     |  days  | `key`, `period`, `result` |   The key to get the result from    | number |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "coin": "ETH",
    "days": 1
  },
  "debug": {
    "cacheKey": "0bf56ec137d7bfc07a543069c420564a3c1d2dc9"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 89.31
  },
  "result": 89.31,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
