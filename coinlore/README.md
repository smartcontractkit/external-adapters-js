# Chainlink External Adapter for Coin Lore

## Global API

### Endpoint

https://api.coinlore.net/api/global/

### Input Params

- `market`, `to`, `quote`: The coin to query (required)
- `endpoint`: The endpoint to use (defaults to "dominance", one of "dominance")

### Output

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
    "result": 60.17
  },
  "result": 60.17,
  "statusCode": 200
}
```
