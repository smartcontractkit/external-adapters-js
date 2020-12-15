# Chainlink External Adapter to Check DNS Records

DNS Adapter lets query DNS over HTTPS (DoH) and check whether some record provided exists

## Input Params

- `name`: Query Name, eg. "example.com"
- `type`: Query Type (either a numeric value or text), eg. "TXT"
- `do` (optional): DO bit - set if client wants DNSSEC data (either boolean or numeric value), eg. "true"
- `cd` (optional): CD bit - set to disable validation (either boolean or numeric value), eg. "false"
- `additional` (required): Record to check, eg: "{ "record": "adex-publisher" }"

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "jobRunID": "1",
    "statusCode": 200,
    "data": true,
    "result": true
  },
  "result": true,
  "statusCode": 200
}
```
