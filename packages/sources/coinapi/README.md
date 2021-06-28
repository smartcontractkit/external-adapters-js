# Chainlink CoinApi External Adapter

### Environment Variables

| Required? |  Name   |                                 Description                                 | Options | Defaults to |
| :-------: | :-----: | :-------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://www.coinapi.io/pricing) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint) |    crypto    |

---

## Crypto Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.
### Input Params

| Required? |            Name            |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            |                   [List](https://docs.coinapi.io/#list-all-assets)                   |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currency to convert to          |                   [List](https://docs.coinapi.io/#list-all-assets)                   |             |
|    🟡     |        `overrides`         | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

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
    "time": "2020-04-15T14:24:15.3834439Z",
    "asset_id_base": "ETH",
    "asset_id_quote": "USD",
    "rate": 159.1132487376848,
    "result": 159.1132487376848
  },
  "result": 159.1132487376848,
  "statusCode": 200
}
```
