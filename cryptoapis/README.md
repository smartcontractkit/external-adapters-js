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

### Blockchain stats

- `blockchain` or `coin`: The blockchain to get stats from
- `network`: The network of the blockchain to get stats from. Default: "mainnet"
- `endpoint`: The parameter to query for. Default: "difficulty"

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

### Balance endpoint

https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/btc/index#btc-address-info-endpoint

- `dataPath`: Optional path where to find the addresses array, defaults to `result`
- `confirmations`: Optional confirmations param, defaults to `6`

- `addresses`: Addresses to query

  {

  - `address`: Address to query
  - `coin`: Optional currency to query, defaults to `btc`, one of `(btc|eth|etc|bch|ltc|dash|doge|btcv|zil)`
  - `chain`: Optional chain to query, defaults to `mainnet`, one of `(mainnet|testnet)`

  }

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
        "chain": "testnet"
      }
    ],
    "dataPath": "addresses"
  }
}
```

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "responses": [
      {
        "payload": {
          "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
          "totalSpent": "0.0498",
          "totalReceived": "131.40923575",
          "balance": "131.35943575",
          "txi": 1,
          "txo": 1590,
          "txsCount": 1587,
          "addresses": ["n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF"]
        }
      }
    ],
    "result": [
      {
        "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
        "chain": "testnet",
        "coin": "btc",
        "balance": "131.35943575"
      }
    ]
  },
  "result": [
    {
      "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
      "chain": "testnet",
      "coin": "btc",
      "balance": "13135943575"
    }
  ],
  "statusCode": 200
}
```
