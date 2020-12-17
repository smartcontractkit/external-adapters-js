# Chainlink External Adapter to Check DNS Records

DNS Record Check lets query DNS over HTTPS (DoH) and check whether some record provided exists

## Input Params

- `record` (required): Record to check, eg: "adex-publisher"

This adapter relies on [`dns-query`](../../dns-query/README.md) adapter. Required `dns-query` input params and configuration apply to this adapter as well.

## Output

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
