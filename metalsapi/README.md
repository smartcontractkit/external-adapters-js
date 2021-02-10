# Chainlink External Adapter for [MetalsAPI](https://metals-api.com/documentation#convertcurrency)

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-endpoint) |    price    |

---

## Price endpoint

### Input Params

| Required? |            Name            |               Description                | Options | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to |         |             |
|    🟡     |          `amount`          |    The amount fo the `base` currency     |         |      1      |

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "query": {
      "from": "XAU",
      "to": "USD",
      "amount": "1"
    },
    "info": {
      "timestamp": 1595252400,
      "rate": 1813.1957606105088
    },
    "historical": false,
    "date": "2020-07-20",
    "result": 1813.1957606105088,
    "unit": "per ounce"
  },
  "result": 1813.1957606105088,
  "statusCode": 200
}
```
