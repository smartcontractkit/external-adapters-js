# Chainlink External Adapter for AlphaChain (SDR)

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "from_symbol": "ETH",
      "last_refreshed": "2020-05-29 08:45:03 +0000 UTC",
      "rate": 301.3654364,
      "time_zone": "UTC",
      "to_symbol": "SDR"
    },
    "jobRunID": "",
    "result": 301.3654364,
    "status": "200"
  },
  "result": 301.3654364,
  "statusCode": 200
}
```
