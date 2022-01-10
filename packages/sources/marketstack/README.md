# Chainlink External Adapter for Marketstack

Version: 1.2.1

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                  |
|           | API_ENDPOINT |             | string |         | `http://api.marketstack.com/v1/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [stock](#stock-endpoint) | `stock` |

---

## Stock Endpoint

Supported names for this endpoint are: `stock`, `eod`.

### Input Params

| Required? |   Name   |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `from`, `coin` |   The symbol of the currency to query    | string |         |         |            |                |
|           | interval |                | The symbol of the currency to convert to | string |         | `1min`  |            |                |
|           |  limit   |                |     The limit for number of results      | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "stock",
    "base": "AAPL",
    "interval": "1min",
    "limit": 1
  },
  "rateLimitMaxAge": 2921840
}
```

Response:

```json
{
  "result": 164.77
}
```
