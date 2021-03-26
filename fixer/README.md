# Chainlink Fixer External Adapter

This adapter is for [Fixer.io](https://fixer.io/) and supports the convert endpoint.

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |    price    |

---

## Price Endpoint

### Input Params

| Required? |          Name           |               Description                | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to |         |             |
|    🟡     |        `amount`         |      The amount of `base` currency       |         |      1      |
|    🟡     |   `overrides`   | If base provided is found in overrides, that will be used  | [Format](../presetSymbols.json)|             |

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "query": {
      "from": "GBP",
      "to": "JPY",
      "amount": 1
    },
    "info": {
      "timestamp": 1519328414,
      "rate": 148.972231
    },
    "historical": "",
    "date": "2018-02-22",
    "result": 148.972231
  },
  "result": 148.972231,
  "statusCode": 200
}
```
