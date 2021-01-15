# Chainlink External Adapter for CryptoAPIs

## Configuration

The adapter takes the following environment variables:

- `API_KEY`: Optional Blochair API key to use
- `API_TIMEOUT`: Optional timeout param, defaults to `30000`

## Input Params

- `endpoint`: The requested data point. One of (`price`|`difficulty`|`height`|`balance`). Defaults: `price`.

### Price

- `base`, `from`, or `coin`: The symbol or ID of the coin to query (required).
- `quote`, `to`, or `market`: The symbol or ID of the market to convert to (required).

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "payload": {
      "weightedAveragePrice": 36670.69405468086,
      "amount": 135.37338203000004,
      "timestamp": 1610724372,
      "datetime": "2021-01-15T15:26:12+0000",
      "baseAsset": "BTC",
      "quoteAsset": "USD"
    },
    "result": 36670.69405468086
  },
  "result": 36670.69405468086,
  "statusCode": 200
}
```

### Difficulty

- `blockchain` or `coin`: The blockchain name (required).
- `network`: The blockchain network name. Default: `mainnet`

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "payload": {
      "difficulty": 20607418304385.63,
      "headers": 666185,
      "chain": "main",
      "chainWork": "000000000000000000000000000000000000000018255ab714d1a15ffccd987e",
      "mediantime": 1610721116,
      "blocks": 666185,
      "bestBlockHash": "0000000000000000000cc82b0a9a6e290cd13721a1abf88fdebb37fdc927308e",
      "currency": "BTC",
      "transactions": 606560353,
      "verificationProgress": 0.9999930065052965
    },
    "result": 20607418304385.63
  },
  "result": 20607418304385.63,
  "statusCode": 200
}
```

### Height

- `blockchain` or `coin`: The blockchain name (required).
- `network`: The blockchain network name. Default: `mainnet`

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "payload": {
      "difficulty": 20607418304385.63,
      "headers": 666185,
      "chain": "main",
      "chainWork": "000000000000000000000000000000000000000018255ab714d1a15ffccd987e",
      "mediantime": 1610721116,
      "blocks": 666185,
      "bestBlockHash": "0000000000000000000cc82b0a9a6e290cd13721a1abf88fdebb37fdc927308e",
      "currency": "BTC",
      "transactions": 606560353,
      "verificationProgress": 0.9999935897991173
    },
    "result": 666185
  },
  "result": 666185,
  "statusCode": 200
}
```

### Balance

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

```

```
