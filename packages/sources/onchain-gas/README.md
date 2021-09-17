# Chainlink External Adapter for Onchain-gas

This adapter calculates the gas price by querying on-chain data

### Environment Variables

| Required? |    Name    |                Description                 | Options | Defaults to |
| :-------: | :--------: | :----------------------------------------: | :-----: | :---------: |
|    ✅     | WS_RPC_URL | The WebSocket RPC URL for the chain's node |         |             |
|    ✅     |  RPC_URL   |   The HTTP RPC URL for the chain's node    |         |             |

---

### Input Parameters

N/A

---

## Onchain-gas Endpoint

### Input Params

| Required? |    Name     |                      Description                       | Options | Defaults to |
| :-------: | :---------: | :----------------------------------------------------: | :-----: | :---------: |
|           | `numBlocks` | The number of blocks to use to determine the gas price |         |      1      |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "numBlocks": 1
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": [101768070829],
  "maxAge": 30000,
  "debug": {
    "cacheHit": true,
    "staleness": 0.836,
    "performance": 0.001656449,
    "providerCost": 0
  },
  "statusCode": 200,
  "data": {
    "result": [101768070829]
  }
}
```
