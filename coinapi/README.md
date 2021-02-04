# Chainlink CoinApi External Adapter

Obtain an API key from [CoinAPI.io](https://www.coinapi.io/pricing).

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-endpoint) |    price    |

---

## Price endpoint

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |             |

### Output

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
