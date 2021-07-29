# Chainlink CurrencyLayer External Adapter

### Environment Variables

| Required? |  Name   |                                  Description                                   | Options | Defaults to |
| :-------: | :-----: | :----------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://currencylayer.com/product) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [live](#Live-Endpoint) |   `price`   |

---

## Price Endpoint

### Input Params

| Required? |          Name           |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :---------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, `market` |         The symbol of the currency to convert to          |                                                                                      |             |
|    🟡     |        `amount`         |                 An amount of the currency                 |                                                                                      |      1      |
|    🟡     |       `overrides`       | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

### Output

```json
{
  "jobRunID": "2",
  "data": {
    "success": true,
    "terms": "https://currencylayer.com/terms",
    "privacy": "https://currencylayer.com/privacy",
    "query": {
      "from": "BTC",
      "to": "USD",
      "amount": 1
    },
    "info": {
      "timestamp": 1612912326,
      "quote": 46500.7849
    },
    "result": 46500.7849
  },
  "result": 46500.7849,
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
        "terms": "https://currencylayer.com/terms",
        "privacy": "https://currencylayer.com/privacy",
        "timestamp": 1432400348,
        "source": "USD",
        "quotes": {
            "USDAUD": 1.278342,
            "USDEUR": 1.278342,
            "USDGBP": 0.908019,
            "USDPLN": 3.731504
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
        ]
    }
}
```
