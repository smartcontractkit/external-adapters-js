# Chainlink External Adapter for CryptoAPIs

## Input Params

- `endpoint`: The endpoint to use. Default: "price"

### Price

- `base`, `from`, or `coin`: The symbol or ID of the coin to query
- `quote`, `to`, or `market`: The symbol or ID of the market to convert to

### Difficulty

- `blockchain` or `coin`: The blockchain to get difficulty from
- `network`: The network of the blockchain to get difficulty from. Default: "mainnet"

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "payload": {
   "weightedAveragePrice": 188.02563659478218,
   "amount": 2848.4069787899994,
   "timestamp": 1587650913,
   "datetime": "2020-04-23T14:08:33+0000",
   "baseAsset": "ETH",
   "quoteAsset": "USD"
  },
  "result": 188.02563659478218
 },
 "result": 188.02563659478218,
 "statusCode": 200
}
```
