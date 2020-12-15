# Chainlink External Adapter for Adex using DNS

Adex adapter to check if DNS have "adex-publisher" information set

## Input Params

Response from DNS adapter:
`Answer`: Array of Answer DNS information, eg: 
```json
{
  "data": {
    "Answer": [
      {
        "name": "strem.io",
        "type": 16,
        "TTL": 300,
        "data": "\"adex-publisher=0xd5860D6196A4900bf46617cEf088ee6E6b61C9d6\""
      }
    ]
  }
}
```

When used along DNS adapter, this info will be passed automatically

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
