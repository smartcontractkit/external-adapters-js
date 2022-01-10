# Chainlink CurrencyLayer External Adapter

Version: 1.2.1

## Environment Variables

| Required? |  Name   |                                  Description                                   |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://currencylayer.com/product) | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                       Options                        |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [live](#live-endpoint) | `convert` |

---

## Convert Endpoint

Supported names for this endpoint are: `convert`, `price`.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `from`, `coin` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote  | `to`, `market` | The symbol of the currency to convert to | string |         |         |            |                |
|           | amount |                |        An amount of the currency         | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "convert",
    "base": "BTC",
    "quote": "USD",
    "amount": 1
  }
}
```

Response:

```json
{
  "success": true,
  "terms": "https://currencylayer.com/terms",
  "privacy": "https://currencylayer.com/privacy",
  "query": {
    "from": "BTC",
    "to": "USD",
    "amount": 1
  },
  "info": {
    "timestamp": 1635800883,
    "quote": 60535.74
  },
  "result": 60535.74
}
```

---

## Live Endpoint

`live` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |         Aliases         | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :---------------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `base`, `from`, `coin`  |             |      |         |         |            |                |
|    ✅     | quote  | `quote`, `to`, `market` |             |      |         |         |            |                |
|           | amount |                         |             |      |         |         |            |                |

There are no examples for this endpoint.
