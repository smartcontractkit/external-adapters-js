# Chainlink External Adapter for LCX

![1.3.37](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/lcx/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://rp.lcx.com/v1/rates/current

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                           Description                           | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :-------------------------------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query, one of `BTC` or `ETH`    |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to, one of `USD` or `EUR` |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "BTC",
    "quote": "USD",
    "endpoint": "price"
  },
  "debug": {
    "cacheKey": "FJwi4xGjPziT9t6opKzk/NGGQms="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": "SUCCESS",
    "message": "Reference Price for BTC",
    "data": {
      "Price": 58620.71
    },
    "result": 58620.71
  },
  "result": 58620.71,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
