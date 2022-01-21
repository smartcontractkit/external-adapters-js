# Chainlink External Adapter for [MetalsAPI](https://metals-api.com/documentation#convertcurrency)

Version: 1.3.1

## Environment Variables

---

### Input Parameters

| Required? |   Name   |     Description     |                         Options                         | Defaults to |
| :-------: | :------: | :-----------------: | :-----------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [convert](#Convert-Endpoint) [latest](#Latest-Endpoint) |   latest    |

---

## Convert Endpoint

| Required? |   Name   |     Description     |  Type  |                         Options                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [latest](#latest-endpoint) | `convert` |

---

## Convert Endpoint

Supported names for this endpoint are: `convert`, `price`.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `from`, `coin` |   The symbol of the currency to query    |        |         |         |            |                |
|    ✅     | quote  | `to`, `market` | The symbol of the currency to convert to |        |         |         |            |                |
|           | amount |                |    The amount fo the `base` currency     | number |         |   `1`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "XAU",
    "quote": "USD"
  },
  "rateLimitMaxAge": 58823529
}
```

Response:

```json
{
  "success": true,
  "query": {
    "from": "XAU",
    "to": "USD",
    "amount": 1
  },
  "info": {
    "timestamp": 1637949420,
    "rate": 1785.0181286441143
  },
  "historical": false,
  "date": "2021-11-26",
  "result": 1785.0181286441143,
  "unit": "per ounce"
}
```

---

## Latest Endpoint

`latest` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |         Aliases         | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :---------------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `base`, `from`, `coin`  |             |      |         |         |            |                |
|    ✅     | quote  | `quote`, `to`, `market` |             |      |         |         |            |                |
|           | amount |                         |             |      |         |         |            |                |

There are no examples for this endpoint.
