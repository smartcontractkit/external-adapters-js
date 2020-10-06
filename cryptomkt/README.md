# Chainlink External Adapter for CryptoMKT

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to
- `endpoint`: Optional endpoint param (default: "ticker")

## Output

```json
{
    "jobRunID":"1",
    "data":{
        "status":"success",
        "data":[
            {
                "timestamp":"2020-10-06T10:51:51.332281",
                "market":"BTCARS",
                "bid":"1559980",
                "ask":"1578940",
                "last_price":"1559980",
                "low":"1530000",
                "high":"1595500",
                "volume":"3.754635486362988398"
            }
        ],
        "result":1559980
    },
    "result":1559980,
    "statusCode":200
}
```
