# Chainlink External Adapters to query RenVM address set

## Input Params

- `network`: Optional param, specify what RenVM network you are talking to (`"mainnet" | "chaosnet" | "testnet"`). Defaults to `testnet`.
- `tokenOrContract`: Optional param, token or contract to return an address for (`RenTokens | RenContract | Asset | ("BTC" | "ZEC" | "BCH")`). Defaults to `BTC`.

```json
{
  "id": "1",
  "data": {
    "tokenOrContract": "btc",
    "network": "testnet"
  }
}
```

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "address": "19iqYbeATe4RxghQZJnYVFU4mjUUu76EA6",
        "coin": "btc",
        "chain": "mainnet"
      }
    ]
  },
  "result": [
    {
      "address": "19iqYbeATe4RxghQZJnYVFU4mjUUu76EA6",
      "coin": "btc",
      "chain": "mainnet"
    }
  ],
  "statusCode": 200
}
```
