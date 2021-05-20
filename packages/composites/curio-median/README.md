# Chainlink Curio-median Composite Adapter

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `API_KEY` | Your Expert Car Broker API key |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `feeds`  |   Array of feed IDs to use    | `[1, 2, 3]` |             |
|    ✅     | `allowedFaults` | Number of faults that will be tolerated |  |             |
|    ✅     | `product` | The product to query for |  |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "feeds": [1, 2, 3],
    "allowedFaults": 1,
    "product": "ferrari-f12tdf"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 1091392.5,
  "statusCode": 200,
  "data": {
    "result": 1091392.5
  }
}
```
