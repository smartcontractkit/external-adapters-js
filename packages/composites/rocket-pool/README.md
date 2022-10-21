# Chainlink Rocket Pool Composite Adapter

## Configuration

The adapter takes the following environment variables:

| Required? |        Name        |           Description            | Options | Defaults to |
| :-------: | :----------------: | :------------------------------: | :-----: | :---------: |
|    ✅     | `ETHEREUM_RPC_URL` | Rocket-pool _required_ parameter |         |             |
|           |      `OPTION`      | Rocket-pool _optional_ parameter |         |   `true`    |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "price": 77777.77,
    "result": 77777.77
  },
  "statusCode": 200
}
```
