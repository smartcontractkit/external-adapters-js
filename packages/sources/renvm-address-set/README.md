# Chainlink External Adapters to query RenVM address set

## Running

### Input Params

| Required? |   Name    | Description | Options | Defaults to |
| :-------: | :-------: | :---------: | :-----: | :---------: |
|         | `network` |    specify what RenVM network you are talking to         |    `mainnet`, `chaosnet`, `testnet`     |   `testnet`     |
|         |     `tokenOrContract`      |     token or contract to return an address for        |         |      `BTC`       |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "tokenOrContract": "btc",
    "network": "testnet"
  }
}
```

### Sample Output

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
