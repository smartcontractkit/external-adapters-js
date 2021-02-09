# Chainlink CurrencyLayer External Adapter

### Environment Variables

| Required? |  Name   |                              Description                              | Options | Defaults to |
| :-------: | :-----: | :-------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be made [here](https://currencylayer.com/product) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |   `price`   |

---

## Price Endpoint

### Input Params

| Required? |          Name           |               Description                | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to |         |             |
|    🟡     |        `amount`         |        An amount of the currency         |         |      1      |

### Output

```json
{
  "jobRunID": "2",
  "data": {
    "success": true,
    "terms": "https://currencylayer.com/terms",
    "privacy": "https://currencylayer.com/privacy",
    "query": {
      "from": "BTC",
      "to": "USD",
      "amount": 1
    },
    "info": {
      "timestamp": 1612912326,
      "quote": 46500.7849
    },
    "result": 46500.7849
  },
  "result": 46500.7849,
  "statusCode": 200
}
```
