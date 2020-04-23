# Chainlink CoinMarketCap Pro External Adapter

## Input Params

- `base`, `from`, `coin`, or `sym`: The coin to query (required)
- `quote`, `to`, `market`, or `convert`: The currency to convert to (required)
- `cid`: The CMC coin ID (optional, use in place of `sym` or `coin`)

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "status": {
   "timestamp": "2020-04-13T20:52:42.250Z",
   "error_code": 0,
   "error_message": null,
   "elapsed": 9,
   "credit_count": 1,
   "notice": null
  },
  "data": {
   "ETH": {
    "id": 1027,
    "name": "Ethereum",
    "symbol": "ETH",
    "slug": "ethereum",
    "num_market_pairs": 5135,
    "date_added": "2015-08-07T00:00:00.000Z",
    "tags": [
     "mineable"
    ],
    "max_supply": null,
    "circulating_supply": 110505332.374,
    "total_supply": 110505332.374,
    "platform": null,
    "cmc_rank": 2,
    "last_updated": "2020-04-13T20:51:27.000Z",
    "quote": {
     "USD": {
      "price": 155.22087406,
      "volume_24h": 16301412264.6787,
      "percent_change_1h": 0.250983,
      "percent_change_24h": -5.25413,
      "percent_change_7d": -5.93502,
      "market_cap": 17152734279.383095,
      "last_updated": "2020-04-13T20:51:27.000Z"
     }
    }
   }
  },
  "result": 155.22087406
 },
 "result": 155.22087406,
 "statusCode": 200
}
```
