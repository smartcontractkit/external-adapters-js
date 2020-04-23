# Chainlink CoinApi External Adapter

Obtain an API key from [CoinAPI.io](https://www.coinapi.io/pricing).

## Input Params

- `base`, `from`, or `coin`: The coin to query (required)
- `quote`, `to`, or `market`: The currency to convert to (required)

## Output

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
