# Chainlink External Adapter for CryptoCompare

### Environment Variables

| Required? |  Name   |                                      Description                                       | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://min-api.cryptocompare.com/pricing) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [multi](#Multi-Endpoint), [price](#Marketcap-Endpoint) |   `price`   |

---

## Price Endpoint

### Input Params

| Required? |          Name           |               Description                | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to |         |             |
|    🟡     |   `overrides`   | If base provided is found in overrides, that will be used  | [Format](../external-adapter/src/overrides/presetSymbols.json)|             |

### Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "USD": 164.02,
    "result": 164.02
  },
  "statusCode": 200
}
```

## Marketcap Endpoint

### Input Params

| Required? |          Name           |               Description                | Options | Defaults to |
| :-------: | :---------------------: | :--------------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`  |   The symbol of the currency to query    |         |             |
|    ✅     | `quote`, `to`, `market` | The symbol of the currency to convert to |         |             |

```json
{
  "jobId": "1",
  "data": {
    "base": "BTC",
    "quote": "USD",
    "endpoint": "marketcap"
  }
}
```
### Output

```json
{
  "jobRunID": "1",
  "statusCode": 200,
  "result": 891651422525.12,
  "data": {
    "result": 891651422525.12
  }
}
```
