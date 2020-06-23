# Chainlink External Adapter for Marketstack

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `endpoint`: Optional endpoint param
- `interval`: The interval for the data (default: 1min)
- `limit`: The limit for number of results (default: 1)

## Output

```json
{
    "jobRunID":"1",
    "data":{
        "pagination":{
            "limit":1,
            "offset":0,
            "count":1,
            "total":25007
        },
        "data":[
            {
                "open":364.015,
                "high":364.15,
                "low":362.28,
                "close":358.87,
                "date":"2020-06-23T13:39:00+0000",
                "symbol":"AAPL",
                "exchange":"IEXG"
            }
        ],
        "result":358.87
    },
    "result":358.87,
    "statusCode":200
}
```
