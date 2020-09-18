# Chainlink External Adapter for LCX api

You must provide the api key using the env variable `API_KEY`!

## Input Params

- `symbol`: The pair to get the rates of (optional, default: all). Available choices:
    - `all`
    - `btc-usd`
    - `btc-eur`
    - `eth-usd`
    - `eth-eur`

## Output Format

```json
{
    "jobRunID": "1",
    "data": {
        "status": "SUCCESS",
        "message": "Reference Price for BTC",
        "data": {
            "Price": 9289.23
        },
        "result": 9289.23
    },
    "result": 9289.23,
    "statusCode": 200
}
```
