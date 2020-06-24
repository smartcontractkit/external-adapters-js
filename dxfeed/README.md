# Chainlink External Adapter for dxFeed

## Configuration

This adapter supports the following environment variables:

- `API_USERNAME`: Your API username
- `API_PASSWORD`: Your API password
- `API_ENDPOINT`: The endpoint for your dxFeed. Defaults to the demo endpoint (`https://tools.dxfeed.com/webservice/rest`)

## Input Params

- `base`, `from`, or `asset`: The symbol of the asset to query
- `endpoint`: Optional endpoint param

## Output

```json
{
    "jobRunID":"1",
    "data":{
        "status":"OK",
        "Trade":{
            "UKX:FTSE":{
                "eventSymbol":"UKX:FTSE",
                "eventTime":0,
                "time":1593001772000,
                "timeNanoPart":0,
                "sequence":115972,
                "exchangeCode":"",
                "price":6194.63,
                "size":0,
                "dayVolume":0,
                "dayTurnover":"NaN",
                "tickDirection":"ZERO_UP",
                "extendedTradingHours":false
            }
        },
        "result":6194.63
    },
    "result":6194.63,
    "statusCode":200
}
```
