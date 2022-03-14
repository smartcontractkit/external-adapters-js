# Chainlink External Adapter for Twelvedata

Version: 1.1.20

`closing` endpoint provides the closing price of the previous day as detailed in [Twelvedata documentation](https://twelvedata.com/docs#end-of-day-price).

`price` endpoint provides the real-time price as detailed in [Twelvedata documentation](https://twelvedata.com/docs#real-time-price).

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |           Description            |  Type  | Options |            Default            |
| :-------: | :----------: | :------------------------------: | :----: | :-----: | :---------------------------: |
|    ✅     |   API_KEY    |      API key for Twelvedata      | string |         |                               |
|           | API_ENDPOINT | The endpoint for your Twelvedata | string |         | `https://api.twelvedata.com/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                             Options                                                                             |  Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [closing](#closing-endpoint), [crypto](#price-endpoint), [eod](#closing-endpoint), [forex](#price-endpoint), [price](#price-endpoint), [stock](#price-endpoint) | `closing` |

---

## Closing Endpoint

This `closing` endpoint provides the closing price of the previous day as detailed in [Twelvedata documentation](https://twelvedata.com/docs#end-of-day-price).

Supported names for this endpoint are: `closing`, `eod`.

### Input Params

| Required? | Name |              Aliases               |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "closing",
    "base": "VXX"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "VXX",
    "exchange": "CBOE",
    "currency": "USD",
    "datetime": "2021-11-05",
    "close": "20.86750",
    "result": 20.8675
  },
  "result": 20.8675,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Price Endpoint

This `price` endpoint provides the real-time price as detailed in [Twelvedata documentation](https://twelvedata.com/docs#real-time-price).

Supported names for this endpoint are: `crypto`, `forex`, `price`, `stock`.

### Input Params

| Required? | Name |              Aliases               |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "base": "VXX"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "price": "20.86750",
    "result": 20.8675
  },
  "result": 20.8675,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
