# Chainlink CoinApi External Adapter

### Environment Variables

| Required? |  Name   |                                 Description                                 | Options | Defaults to |
| :-------: | :-----: | :-------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://www.coinapi.io/pricing) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |    price    |

---

## Price Endpoint

### Input Params

| Required? |            Name            |               Description                |                     Options                      | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :----------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | [List](https://docs.coinapi.io/#list-all-assets) |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | [List](https://docs.coinapi.io/#list-all-assets) |             |

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
