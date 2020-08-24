# Chainlink CoinGecko External Adapter

## Input Params

- `coinid`: The CoinGecko id of the coin to query (required if not using `from`)
- `base`, `from`, or `coin`: The ticker of the coin to query (required if not using `coinid`)
- `quote`, `to`, or `market`: The currency to convert to
- `endpoint`: The endpoint to use (defaults to "price", one of "price", "globalMarketCap")

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "ethereum": {
   "usd": 157.24
  },
  "result": 157.24
 },
 "result": 157.24,
 "statusCode": 200
}
```
