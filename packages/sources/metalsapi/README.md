# Chainlink External Adapter for [MetalsAPI](https://metals-api.com/documentation#convertcurrency)

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

| Required? |            Name            |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currency to convert to          |                                                                                      |             |
|    🟡     |          `amount`          |             The amount fo the `base` currency             |                                                                                      |      1      |
|    🟡     |        `overrides`         | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "success": true,
    "query": {
      "from": "XAU",
      "to": "USD",
      "amount": "1"
    },
    "info": {
      "timestamp": 1595252400,
      "rate": 1813.1957606105088
    },
    "historical": false,
    "date": "2020-07-20",
    "result": 1813.1957606105088,
    "unit": "per ounce"
  },
  "result": 1813.1957606105088,
  "statusCode": 200
}
```

## Latest Endpoint
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
        "timestamp": 1627564680,
        "date": "2021-07-29",
        "base": "USD",
        // Shortened for the purposes of this example
        "rates": {
            "ADA": 0.7823791647114,
            "AED": 3.67475189455,
            "AFN": 79.78921717425,
            "ALL": 102.60027023532,
            "ALU": 12.412282878412,
            "...": "..."
        },
        "unit": "per ounce",
        "results": [
            [
                {
                    "id": "1",
                    "data": {
                        "base": "USD",
                        "quote": "EUR"
                    },
                    "rateLimitMaxAge": 960
                },
                0.841928
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "base": "USD",
                        "quote": "AUD"
                    },
                    "rateLimitMaxAge": 960
                },
                1.3547253478
            ]
        ]
    }
}
```
