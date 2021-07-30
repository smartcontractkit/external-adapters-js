# Chainlink External Adapter for CryptoCompare

### Environment Variables

| Required? |  Name   |                                      Description                                       | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://min-api.cryptocompare.com/pricing) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                          Options                           | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint), [marketcap](#Marketcap-Endpoint) |   `crypto`   |

---

## Crypto Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.
### Input Params

| Required? |          Name           |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :---------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, `market` |         The symbol of the currency to convert to          |                                                                                      |             |
|    🟡     |       `overrides`       | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
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

### Sample Input

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

### Sample Output

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
