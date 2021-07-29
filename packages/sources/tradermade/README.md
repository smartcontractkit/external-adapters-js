# Chainlink External Adapter for Tradermade

### Environment Variables

| Required? |    Name    |                                           Description                                           | Options | Defaults to |
| :-------: | :--------: | :---------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |  API_KEY   | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) |         |             |
|           | WS_API_KEY | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) |         |             |

### Websocket support

This adapter has Websocket support for only the forex endpoint

---

### Input Parameters

| Required? |           Name            |                                                                   Description                                                                   |                       Options                        | Defaults to |
| :-------: | :-----------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------------------------: | :---------: |
|           |        `endpoint`         |                                                               The endpoint to use                                                               | [`live`](#Live-Endpoint), [`forex`](#Forex-Endpoint) |   `live`    |
|    ✅     | `base`, `from`, or `coin` |                                                       The symbol of the currency or currencies to query                                                       |                                                      |             |
|           |        `overrides`        | If base provided is found in overrides, that will be used. [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |                                                      |             |

## Live Endpoint

Aliases: `commodities`

| Required? | Name |    Description     | Options | Defaults to |
| :-------: | :--: | :----------------: | :-----: | :---------: |
|           | `to` | The quote currency |         |             |

## Sample Input to fetch equity data

```json
{
  "id": "1",
  "data": {
    "base": "AAPL"
  }
}
```

## Single Currency Pair Example

## Input
```json
{
    "id": "1",
    "data": {
        "base": "USD",
        "to": "EUR"
    }
}
```

## Output
```json
{
    "jobRunID": "1",
    "result": 0.841432,
    "debug": {
        "staleness": 0,
        "performance": 0.312505529,
        "providerCost": 1,
        "batchablePropertyPath": [
            "from",
            "to"
        ]
    },
    "statusCode": 200,
    "data": {
        "result": 0.841432
    }
}
```


## Batch Example

## Input
```json
{
    "id": "1",
    "data": {
        "base": ["USD","CAD"],
        "to": ["EUR","AUD"]
    }
}
```

## Output

```json
{
  "jobRunID": "1",
  "result": 153.605,
  "debug": {
    "staleness": 0,
    "performance": 0.611584299,
    "providerCost": 1
  },
  "statusCode": 200,
  "data": {
    "endpoint": "live",
    "quotes": [
      {
        "ask": 153.61,
        "bid": 153.6,
        "instrument": "AAPL",
        "mid": 153.605
      }
    ],
    "requested_time": "Fri, 03 Sep 2021 01:09:03 GMT",
    "timestamp": 1630631344,
    "result": 153.605
  }
}
```

## Forex Endpoint

This endpoint supports WS

| Required? |                Name                |    Description     | Options | Defaults to |
| :-------: | :--------------------------------: | :----------------: | :-----: | :---------: |
|    ✅     | `quote`, `to`, `market`, `convert` | The quote currency |         |             |

## Single Currency Pair Example

## Input
```json
{
    "id": "1",
    "data": {
        "base": "USD",
        "to": "EUR"
    }
}
```

## Output
```json
{
    "jobRunID": "1",
    "result": 0.841432,
    "debug": {
        "staleness": 0,
        "performance": 0.312505529,
        "providerCost": 1,
        "batchablePropertyPath": [
            "from",
            "to"
        ]
    },
    "statusCode": 200,
    "data": {
        "result": 0.841432
    }
}
```


## Batch Example

## Input
```json
{
    "id": "1",
    "data": {
        "base": ["USD","CAD"],
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
                "ask": 0.841446,
                "base_currency": "USD",
                "bid": 0.841446,
                "mid": 0.841446,
                "quote_currency": "EUR"
            },
            {
                "ask": 1.35439,
                "base_currency": "USD",
                "bid": 1.354353,
                "mid": 1.354371,
                "quote_currency": "AUD"
            },
            {
                "ask": 0.674955,
                "base_currency": "CAD",
                "bid": 0.67491,
                "mid": 0.674932,
                "quote_currency": "EUR"
            },
            {
                "ask": 1.086425,
                "base_currency": "CAD",
                "bid": 1.086366,
                "mid": 1.08639,
                "quote_currency": "AUD"
            }
        ],
        "requested_time": "Thu, 29 Jul 2021 13:51:08 GMT",
        "timestamp": 1627566669,
        "results": [
            [
                {
                    "id": "1",
                    "data": {
                        "base": [
                            "USD",
                            "CAD"
                        ],
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
                        "base": [
                            "USD",
                            "CAD"
                        ],
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
                        "base": [
                            "USD",
                            "CAD"
                        ],
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
                        "base": [
                            "USD",
                            "CAD"
                        ],
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
