# Chainlink External Adapter for LCX api

You must provide the api key using the env variable `API_KEY`!

## Input Params

- `endpoint`: Endpoint to call (optional, default: `all`). Available choices:
    - `all`
    - `symbol`
- `pair`: The pair to get the rates of (mandatory). Available choices:
    - `btc-usd`
    - `btc-eur`
    - `eth-usd`
    - `eth-eur`

## Output Format

When use `symbol` endpoint, input params could look like this:
```json

{
    "data": {
        "endpoint": "symbol",
        "pair": "btc-eur"
    }
}
```
Possible result:
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

When use the `all` endpoint:
```json
{
    "data": {
        "endpoint": "all"
    }
}
```
Possible result:
```json
{
    "jobRunID": "1",
    "data": {
        "result": {
            "btc-usd": 10491.63,
            "btc-eur": 8952.45,
            "eth-usd": 342.94,
            "eth-eur": 292.46
        },
        "btc-usd": {
            "status": "SUCCESS",
            "message": "Reference Price for BTC",
            "data": {
                "Price": 10491.63
            }
        },
        "btc-eur": {
            "status": "SUCCESS",
            "message": "Reference Price for BTC",
            "data": {
                "Price": 8952.45
            }
        },
        "eth-usd": {
            "status": "SUCCESS",
            "message": "Reference Price for ETH",
            "data": {
                "Price": 342.94
            }
        },
        "eth-eur": {
            "status": "SUCCESS",
            "message": "Reference Price for ETH",
            "data": {
                "Price": 292.46
            }
        }
    },
    "result": {
        "btc-usd": 10491.63,
        "btc-eur": 8952.45,
        "eth-usd": 342.94,
        "eth-eur": 292.46
    },
    "statusCode": 200
}
```
