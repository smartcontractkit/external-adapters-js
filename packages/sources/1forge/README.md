# Chainlink External Adapter for 1forge

### Environment Variables

| Required? |  Name   |                        Description                        | Options | Defaults to |
| :-------: | :-----: | :-------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from the 1forge dashboard |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [forex](#Forex-Endpoint), [quotes](#Quotes-Endpoint) |    forex    |

---

## Forex Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.

[`/convert`](https://1forge.com/api#convert) - Convert from one currency to another

### Input Params

| Required? |      Name      |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from` |            The symbol of the currency to query            |                       [List](https://1forge.com/currency-list)                       |             |
|    ✅     | `quote`, `to`  |         The symbol of the currency to convert to          |                       [List](https://1forge.com/currency-list)                       |             |
|    🟡     |   `quantity`   |       An additional amount of the original currency       |                                                                                      |             |
|    🟡     |  `overrides`   | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "value": 1.22687,
    "text": "1.0 GBP is worth 1.22687 USD",
    "timestamp": 1587489920,
    "result": 1.22687
  },
  "result": 1.22687,
  "statusCode": 200
}
```

## Quotes Endpoint
#### Returns a batched price comparison from a list currencies to a list of other currencies.

[`/quotes`](https://1forge.com/api#quotes) - Convert from one currency to another

### Input Params

| Required? |      Name      |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from` |            The symbol of the currency to query            |                       [List](https://1forge.com/currency-list)                       |             |
|    ✅     | `quote`, `to`  |         The symbol of the currency to convert to          |                       [List](https://1forge.com/currency-list)                       |             |                                                                              |             |
|    🟡     |  `overrides`   | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

## Input
```json
{
    "id": "1",
    "data": {
        "from": ["USD","CAD"],
        "to": ["EUR","AUD"]
    }
}
```

## Output

```json
{
    "jobRunID": "1",
    "debug": {
        "staleness": 0,
        "performance": 0.340576126,
        "providerCost": 1,
        "batchablePropertyPath": [
            "from",
            "to"
        ]
    },
    "statusCode": 200,
    "data": {
        "endpoint": "live",
        "quotes": [
            {
                "p": 0.84683,
                "a": 0.84685,
                "b": 0.8468,
                "s": "USD/EUR",
                "t": 1627307111520
            },
            {
                "p": 1.35439,
                "a": 1.354353,
                "b": 1.354371,
                "s": "USD/AUD",
                "t": 1627307111520
            },
            {
                "p": 0.674955,
                "a": 0.67491,
                "b": 0.674932,
                "s": "CAD/EUR",
                "t": 1627307111520
            },
            {
                "p": 1.086425,
                "a": 1.08639,
                "b": 1.086366,
                "s": "CAD/AUD",
                "t": 1627307111520
            }
        ],
        "requested_time": "Thu, 29 Jul 2021 13:51:08 GMT",
        "timestamp": 1627566669,
        "results": [
            [
                {
                    "id": "1",
                    "data": {
                        "to": "EUR",
                        "from": "USD"
                    },
                    "rateLimitMaxAge": 960
                },
                0.841446
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "to": "AUD",
                        "from": "USD"
                    },
                    "rateLimitMaxAge": 960
                },
                1.354371
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "to": "EUR",
                        "from": "CAD"
                    },
                    "rateLimitMaxAge": 960
                },
                0.674932
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "to": "AUD",
                        "from": "CAD"
                    },
                    "rateLimitMaxAge": 960
                },
                1.08639
            ]
        ]
    }
}
```

