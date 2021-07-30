# Chainlink External Adapter to Check DNS Records

DNS Record Check lets query DNS over HTTPS (DoH) and check whether some record provided exists

## Configuration

This adapter relies on [`dns-query`](../../dns-query/README.md) adapter. Required `dns-query` input params and configuration apply to this adapter as well.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |   Name   |             Description              | Options | Defaults to |
| :-------: | :------: | :----------------------------------: | :-----: | :---------: |
|    ✅     | `record` | name of record, eg: "adex-publisher" |         |             |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "record": "adex-publisher"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": true
  },
  "result": true,
  "statusCode": 200
}
```
