# Chainlink External Adapter for Trading Economics

## Configuration

The adapter takes the following environment variables:

- `API_CLIENT_KEY`: Your API client key
- `API_CLIENT_SECRET`: Your API client secret
- `WS_TIMEOUT`: The timeout for waiting for a response in the WS stream (default: 5000)

## Input Params

- `base`, `from`, or `asset`: The symbol of the asset to query

## Output

```json
{
    "jobRunID":"1",
    "data":{
        "s":"UKX:IND",
        "i":"UKX",
        "pch":-0.28,
        "nch":-17.37,
        "bid":6106.32,
        "ask":6106.32,
        "price":6106.32,
        "dt":1593080344361,
        "state":"open",
        "type":"index",
        "dhigh":6320.12,
        "dlow":6068.87,
        "o":6320.12,
        "prev":6123.69,
        "topic":"UKX",
        "result":6106.32
    },
    "result":6106.32,
    "statusCode":200
}
```
