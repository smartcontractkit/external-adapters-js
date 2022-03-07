# Chainlink External Adapter for Tradingeconomics

Version: 1.1.17

This adapter uses the Tradingeconomics WS stream

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |       Name        |        Description         |  Type  | Options |                                     Default                                      |
| :-------: | :---------------: | :------------------------: | :----: | :-----: | :------------------------------------------------------------------------------: |
|           |      API_URL      | The URL of the WS endpoint | string |         | `wss://stream.tradingeconomics.com/ or https://api.tradingeconomics.com/markets` |
|    ✅     |  API_CLIENT_KEY   |    Your API client key     | string |         |                                                                                  |
|    ✅     | API_CLIENT_SECRET |   Your API client secret   | string |         |                                                                                  |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

---

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name |     Aliases     |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-------------: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `from` | The symbol of the asset to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "EURUSD:CUR"
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
