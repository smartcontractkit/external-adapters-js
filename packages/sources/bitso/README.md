# Chainlink External Adapter for Bitso

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to
- `endpoint`: Optional endpoint param (default: "ticker")

## Output

```json
{
    "jobRunID":"1",
    "data":{
        "success":true,
        "payload":{
            "high":"1581920.78",
            "last":"1567306.98",
            "created_at":"2020-10-06T10:57:38+00:00",
            "book":"btc_ars",
            "volume":"16.96252687",
            "vwap":"1568906.7103474855",
            "low":"1553404.00",
            "ask":"1574120.27",
            "bid":"1567306.98",
            "change_24":"2345.15"
        },
        "result":1567306.98
    },
    "result":1567306.98,
    "statusCode":200
}
```
