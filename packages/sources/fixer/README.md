# Chainlink Fixer External Adapter

This adapter is for [Fixer.io](https://fixer.io/) and supports the convert endpoint.

### Environment Variables

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|    ✅     | API_KEY |             |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |    price    |

---

## Price Endpoint

### Input Params

| Required? |          Name           |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :---------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, `market` |         The symbol of the currency to convert to          |                                                                                      |             |
|    🟡     |        `amount`         |               The amount of `base` currency               |                                                                                      |      1      |
|    🟡     |       `overrides`       | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "query": {
      "from": "GBP",
      "to": "JPY",
      "amount": 1
    },
    "info": {
      "timestamp": 1519328414,
      "rate": 148.972231
    },
    "historical": "",
    "date": "2018-02-22",
    "result": 148.972231
  },
  "result": 148.972231,
  "statusCode": 200
}
```

## Live Endpoint
#### Returns a batched price comparison from one currency to a list of other currencies.
### Input Params

| Required? |            Name            |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currencies to convert to               |                                                                                      |      1      |
|    🟡     |        `overrides`         | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

## Input
```json
{
    "id": "1",
    "data": {
        "base": "USD",
        "quote": ["EUR","AUD"]
    }
}
```

## Output

```json
{
    "jobRunID": "1",
    "debug": {
        "staleness": 0,
        "performance": 0.965477773,
        "providerCost": 1,
        "batchablePropertyPath": [
            "base",
            "quote"
        ]
    },
    "statusCode": 200,
    "data": {
        "success": true,
        "timestamp": 1519296206,
        "base": "USD",
        "date": "2021-07-29",
        "rates": {
            "AUD": 1.278342,
            "EUR": 1.278342,
            "GBP": 0.908019,
            "PLN": 3.731504
        },
        "results": [
            [
                {
                    "id": "1",
                    "data": {
                        "base": "USD",
                        "quote": "AUD"
                    },
                    "rateLimitMaxAge": 960
                },
                1.278342
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "base": "USD",
                        "quote": "EUR"
                    },
                    "rateLimitMaxAge": 960
                },
                1.278342
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "base": "USD",
                        "quote": "GBP"
                    },
                    "rateLimitMaxAge": 960
                },
                0.908019
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "base": "USD",
                        "quote": "PLN"
                    },
                    "rateLimitMaxAge": 960
                },
                3.731504
            ]
        ]
    }
}
```

