# Chainlink External Adapter to Check DNS Records

DNS Record Check lets query DNS over HTTPS (DoH) and check whether some record provided exists

## Configuration

This adapter relies on [`dns-query`](../../dns-query/README.md) adapter. Required `dns-query` input params and configuration apply to this adapter as well.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |       Name       |                                      Description                                       | Options | Defaults to |
| :-------: | :--------------: | :------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `name`, `record` |                          name of record, eg: "adex-publisher"                          |         |             |
|    ✅     |      `type`      |                 Query Type (either a numeric value or text), eg. "TXT"                 |         |             |
|           |       `do`       | DO bit - set if client wants DNSSEC data (either boolean or numeric value), eg. "true" |         |             |
|           |       `cd`       |   CD bit - set to disable validation (either boolean or numeric value), eg. "false"    |         |             |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "record": "example.com",
    "type": "TXT"
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
