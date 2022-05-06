# Chainlink External Adapter for Tradermade

This adapter only has Websocket support for the forex endpoint.

![1.6.28](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tradermade/package.json)

Base URL wss://marketdata.tradermade.com/feedadv

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                           Description                                           |  Type  | Options |                     Default                     |
| :-------: | :----------: | :---------------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) | string |         |                                                 |
|           | API_ENDPOINT |                                                                                                 | string |         | `https://marketdata.tradermade.com/api/v1/live` |
|           |  WS_API_KEY  | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) | string |         |                                                 |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                 Options                                                  | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#live-endpoint), [forex](#forex-endpoint), [live](#live-endpoint), [stock](#live-endpoint) | `live`  |

## Live Endpoint

Supported names for this endpoint are: `commodities`, `live`, `stock`.

### Input Params

| Required? | Name  |          Aliases           |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `market`, `symbol` | The symbol of the currency to query | string |         |         |            |                |
|           | quote |      `convert`, `to`       |         The quote currency          | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "live",
    "base": "AAPL"
  },
  "debug": {
    "cacheKey": "HHpABsvAKoDprbxdQVUIgj+YoK0="
  },
  "rateLimitMaxAge": 5843681
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "endpoint": "live",
    "quotes": [
      {
        "ask": 150.51,
        "bid": 150.5,
        "instrument": "AAPL",
        "mid": 150.50501
      }
    ],
    "requested_time": "Fri, 05 Nov 2021 17:12:07 GMT",
    "timestamp": 1636132328,
    "result": 150.50501
  },
  "result": 150.50501,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Forex Endpoint

`forex` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |          Aliases          |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |     `from`, `symbol`      | The symbol of the currency to query |      |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` |         The quote currency          |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "forex",
    "base": "ETH",
    "quote": "USD"
  },
  "debug": {
    "cacheKey": "QjGCaijj/AZfhRuMfhhiXZgSxOY="
  },
  "rateLimitMaxAge": 2921840
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "endpoint": "live",
    "quotes": [
      {
        "ask": 4494.03,
        "base_currency": "ETH",
        "bid": 4494.02,
        "mid": 4494.0249,
        "quote_currency": "USD"
      }
    ],
    "requested_time": "Fri, 05 Nov 2021 17:11:25 GMT",
    "timestamp": 1636132286,
    "result": 4494.0249
  },
  "result": 4494.0249,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
