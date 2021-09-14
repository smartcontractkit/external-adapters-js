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

| Required? |                 Name                 |                      Description                       |
| :-------: | :----------------------------------: | :----------------------------------------------------: |
|    ✅     |              `sources`               | An array or comma delimited 2 source adapters to query |
|    ✅     | `days`, `key`, `result`, or `period` |               Prive value interval days                |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "sources": ["coingecko", "coinmarketcap"],
    "days": 1,
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
