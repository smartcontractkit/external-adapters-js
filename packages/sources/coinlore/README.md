# Chainlink External Adapter for Coin Lore

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [global](#Global-Endpoint) |   global    |

There are two Chainlink "endpoint" behaviors (`dominance` and `globalmarketcap`) that use the `global` API endpoint.
The default is to use the Chainlink `dominance` behavior.

---

## Global Endpoint

### Input Params

| Required? |  Name   |                                   Description                                   |   Options    | Defaults to |
| :-------: | :-----: | :-----------------------------------------------------------------------------: | :----------: | :---------: |
|           | `field` |     The object path to access the value that will be returned as the result     |              |     `d`     |
|           | `base`  | When using a field of `d`, the currency to prefix the field with (e.g. `usd_d`) | `btc`, `eth` |    `btc`    |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "eth",
    "field": "d"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "coins_count": 5101,
    "active_markets": 18365,
    "total_mcap": 347644452463.34247,
    "total_volume": 88195669202.08769,
    "btc_d": "60.17",
    "eth_d": "11.87",
    "mcap_change": "-2.19",
    "volume_change": "15.15",
    "avg_change_percent": "-0.23",
    "volume_ath": 281440138896.8489,
    "mcap_ath": 825596367558,
    "result": 11.87
  },
  "result": 11.87,
  "statusCode": 200
}
```
