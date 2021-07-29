# Chainlink Open Exchange Rates External Adapter

### Environment Variables

| Required? |  Name   |                                    Description                                     | Options | Defaults to |
| :-------: | :-----: | :--------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](hhttps://openexchangerates.org/signup) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [forex](#Forex-Endpoint) |    forex    |

---

## Forex Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.
### Input Params

| Required? |            Name            |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currency or currenicies to convert to          |                                                                                      |             |
|    🟡     |        `overrides`         | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

## Singular Currnecy Pair Example

## Input
```json
{
    "id": "1",
    "data": {
        "base": "USD",
        "quote": "EUR"
    }
}
```

## Outpput
```json
{
    "jobRunID": "1",
    "result": 0.841406,
    "debug": {
        "staleness": 0,
        "performance": 0.224847981,
        "providerCost": 1,
        "batchablePropertyPath": [
            "base",
            "quote"
        ]
    },
    "statusCode": 200,
    "data": {
        "result": 0.841406
    }
}
```

## Batch Example

## Input
```json
{
    "id": "1",
    "data": {
        "base": "USD",
        "quote": ["EUR", "AUD", "CAD"]
    }
}
```

## Outpput
```json
{
    "jobRunID": "1",
    "debug": {
        "staleness": 0,
        "performance": 0.171254197,
        "providerCost": 1,
        "batchablePropertyPath": [
            "base",
            "quote"
        ]
    },
    "statusCode": 200,
    "data": {
        "disclaimer": "Usage subject to terms: https://openexchangerates.org/terms",
        "license": "https://openexchangerates.org/license",
        "timestamp": 1627567200,
        "base": "USD",
        // Shorted for the purposes of this example
        "rates": {
            "AED": 3.6732,
            "AFN": 79.716675,
            "ALL": 102.565385,
            "AMD": 486.2065,
            "ANG": 1.795289,
            "AOA": 639,
            "ARS": 96.6596,
            "...":"..."
        },
        "results": [
            [
                {
                    "id": "1",
                    "data": {
                        "endpoint": "forex",
                        "base": "USD",
                        "quote": "EUR"
                    },
                    "rateLimitMaxAge": 1920
                },
                0.841406
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "endpoint": "forex",
                        "base": "USD",
                        "quote": "AUD"
                    },
                    "rateLimitMaxAge": 1920
                },
                1.353459
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "endpoint": "forex",
                        "base": "USD",
                        "quote": "CAD"
                    },
                    "rateLimitMaxAge": 1920
                },
                1.247303
            ]
        ]
    }
}
```
