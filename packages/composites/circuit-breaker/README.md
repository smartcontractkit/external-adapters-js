# Chainlink Circuit-breaker Composite Adapter

This composite adapter makes use of 2 EA sources to capture pair values

## Configuration

The adapter takes the following environment variables:

| Required? |          Name          |                 Description                 | Options | Defaults to |
| :-------: | :--------------------: | :-----------------------------------------: | :-----: | :---------: |
|           | `[source]_ADAPTER_URL` | The adapter URL to query for any `[source]` |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |       Name        |          Description           |
| :-------: | :---------------: | :----------------------------: |
|    ✅     |  `primarySource`  | First source adapters to query |
|    ✅     | `secondarySource` | Second source adapter to query |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "primarySource": "coingecko",
    "secondarySource": "coinmarketcap",
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 3286.01,
  "statusCode": 200,
  "data": {
    "result": 3286.01
  }
}
```
