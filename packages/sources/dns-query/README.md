# Chainlink External Adapter to query DNS

DNS Query lets query DNS over HTTPS (DoH)

### Environment Variables

The adapter takes the following environment variables:

| Required? |       Name        |                         Description                          |        Options         | Defaults to |
| :-------: | :---------------: | :----------------------------------------------------------: | :--------------------: | :---------: |
|    ✅     |  `DNS_PROVIDER`   |                     DNS provider to use                      | `cloudflare`, `google` |             |
|           | `CUSTOM_ENDPOINT` | DNS provider URL to override default URLs for `DNS_PROVIDER` |                        |

### Input Params

| Required? |  Name  |                                      Description                                       | Options | Defaults to |
| :-------: | :----: | :------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `name` |                             Query Name, eg. "example.com"                              |         |             |
|    ✅     | `type` |                 Query Type (either a numeric value or text), eg. "TXT"                 |         |             |
|           |  `do`  | DO bit - set if client wants DNSSEC data (either boolean or numeric value), eg. "true" |         |             |
|           |  `cd`  |   CD bit - set to disable validation (either boolean or numeric value), eg. "false"    |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "name": "example.com",
    "type": "TXT"
  }
}
```

### Sample Output

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
