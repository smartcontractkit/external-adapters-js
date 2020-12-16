# Chainlink External Adapter to Check DNS Records

DNS Record Check lets query DNS over HTTPS (DoH) and check whether some record provided exists

## Configuration

The adapter takes the following environment variables:

- `DNS_PROVIDER`: DNS provider to use. Options available:
    - `cloudfare`
    - `google`

## Input Params

- `record` (required): Record to check, eg: "adex-publisher"

This adapter relies on [`dns-query`](../../dns-query/README.md) adapter. Required `dns-query` input params should be added into this one as well.

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
