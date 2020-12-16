# Chainlink External Adapter to query DNS

DNS Query lets query DNS over HTTPS (DoH)

## Configuration

The adapter takes the following environment variables:

- `DNS_PROVIDER`: DNS provider to use. Options available:
    - `cloudfare`
    - `google`

## Input Params

- `name`: Query Name, eg. "example.com"
- `type`: Query Type (either a numeric value or text), eg. "TXT"
- `do` (optional): DO bit - set if client wants DNSSEC data (either boolean or numeric value), eg. "true"
- `cd` (optional): CD bit - set to disable validation (either boolean or numeric value), eg. "false"

## Output

```json
{
    "jobRunID": "1",
    "data": {
        "Status": 0,
        "TC": false,
        "RD": true,
        "RA": true,
        "AD": true,
        "CD": false,
        "Question": [
            {
                "name": "strem.io",
                "type": 16
            }
        ],
        "Answer": [
            {
                "name": "strem.io",
                "type": 16,
                "TTL": 300,
                "data": "\"adex-publisher=0xd5860D6196A4900bf46617cEf088ee6E6b61C9d6\""
            },
            {
                "name": "strem.io",
                "type": 16,
                "TTL": 300,
                "data": "\"google-site-verification=tYiWtmWtTz38gVx0Gav9fUbchyTbSnd2PKwlyC54ec0\""
            }
        ],
        "result": null
    },
    "result": null,
    "statusCode": 200
}
```
