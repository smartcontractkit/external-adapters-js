# Chainlink External Adapter for Twelvedata

Version: 1.1.1

`closing` endpoint provides the closing price of the previous day as detailed in [Twelvedata documentation](https://twelvedata.com/docs#end-of-day-price).

`price` endpoint provides the real-time price as detailed in [Twelvedata documentation](https://twelvedata.com/docs#real-time-price).

## Environment Variables

| Required? |     Name     |           Description            |  Type  | Options |            Default            |
| :-------: | :----------: | :------------------------------: | :----: | :-----: | :---------------------------: |
|    ✅     |   API_KEY    |      API key for Twelvedata      | string |         |                               |
|           | API_ENDPOINT | The endpoint for your Twelvedata | string |         | `https://api.twelvedata.com/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                        Options                         |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [closing](#closing-endpoint), [price](#price-endpoint) | `closing` |

---

## Closing Endpoint

Supported names for this endpoint are: `closing`, `eod`.

### Input Params

| Required? | Name |              Aliases               |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `coin`, `market`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

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
  "symbol": "VXX",
  "exchange": "CBOE",
  "currency": "USD",
  "datetime": "2021-11-05",
  "close": "20.86750",
  "result": 20.8675
}
```

---

## Price Endpoint

Supported names for this endpoint are: `price`, `crypto`, `stock`, `forex`.

### Input Params

| Required? | Name |              Aliases               |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `coin`, `market`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

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
  "price": "20.86750",
  "result": 20.8675
}
```
