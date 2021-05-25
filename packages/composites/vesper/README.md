# Chainlink Vesper Composite Adapter

This adapter gets the total TVL from the Vesper pool in the controller.

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `RPC_URL` | Vesper _required_ parameter |         |             |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `controller`  |   The address of the controller contract    |  |             |

**Additional environment input params must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

### Sample Input

```json
{
  "id": "1",
  "data": {
    "controller": "0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217",
    "quote": "USD",
    "source": "coinpaprika"
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
