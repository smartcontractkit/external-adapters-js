# Chainlink External Adapter for CryptoAPIs

## Configuration

The adapter takes the following environment variables:

- `API_KEY`: Optional Blochair API key to use
- `API_TIMEOUT`: Optional timeout param, defaults to `30000`

## Input Params

- `endpoint`: The endpoint to use. Default: "price"

### Price endpoint

- `base`, `from`, or `coin`: The symbol or ID of the coin to query
- `quote`, `to`, or `market`: The symbol or ID of the market to convert to

### Difficulty endpoint

- `blockchain` or `coin`: The blockchain to get difficulty from
- `network`: The network of the blockchain to get difficulty from. Default: "mainnet"

### Height

- `blockchain` or `coin`: The blockchain to get latest block number from
- `network`: The network of the blockchain to get latest block number from. Default: "mainnet"

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
