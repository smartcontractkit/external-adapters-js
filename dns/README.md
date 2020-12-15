# Chainlink External Adapter for DNS

DNS Adapter lets query any detail from DNS

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
                "name": "example.com",
                "type": 16
            }
        ],
        "Answer": [
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
