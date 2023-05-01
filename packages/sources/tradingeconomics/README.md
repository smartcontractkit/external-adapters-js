# Chainlink External Adapter for Tradingeconomics

![2.2.17](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tradingeconomics/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This adapter uses the Tradingeconomics WS stream

Base URL wss://stream.tradingeconomics.com/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |        Description         |  Type  | Options |                                     Default                                      |
| :-------: | :---------------: | :------------------------: | :----: | :-----: | :------------------------------------------------------------------------------: |
|           |      API_URL      | The URL of the WS endpoint | string |         | `wss://stream.tradingeconomics.com/ or https://api.tradingeconomics.com/markets` |
|    ✅     |  API_CLIENT_KEY   |    Your API client key     | string |         |                                                                                  |
|    ✅     | API_CLIENT_SECRET |   Your API client secret   | string |         |                                                                                  |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                         Options                          |  Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [price-ws](#price_ws-endpoint), [price](#price-endpoint) | `price-ws` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |     Aliases     |              Description               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-------------: | :------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `from` |    The symbol of the asset to query    | string |         |         |            |                |
|           | quote |  `term`, `to`   | The quote symbol of the asset to query | string |         |  `USD`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "EURUSD:CUR",
    "quote": "USD",
    "endpoint": "price"
  },
  "debug": {
    "cacheKey": "G72mWx8TQqfLPgLuCIW2YPsN/9s="
  },
  "rateLimitMaxAge": 7999
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 1.15591
  },
  "result": 1.15591,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Price_ws Endpoint

`price-ws` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |     Aliases     |              Description               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-------------: | :------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `from` |    The symbol of the asset to query    | string |         |         |            |                |
|           | quote |  `term`, `to`   | The quote symbol of the asset to query | string |         |  `USD`  |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
