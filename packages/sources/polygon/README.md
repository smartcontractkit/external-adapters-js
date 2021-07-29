# Chainlink Polygon External Adapter

This adapter is for [Polygon.io](https://polygon.io/) and supports the conversion endpoint.

### Environment Variables

| Required? |  Name   |                                   Description                                    | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://polygon.io/dashboard/signup) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [forex](#Forex-Endpoint) |    forex    |

---

## Forex Endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.
Get FOREX price conversions

### Input Params

| Required? |            Name            |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            |                                 `BTC`, `ETH`, `USD`                                  |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currency to convert to          |                                 `BTC`, `ETH`, `USD`                                  |             |
|    🟡     |          `amount`          |            The amount of the `base` to convert            |                                                                                      |      1      |
|    🟡     |        `precision`         |       The number of significant figures to include        |                                                                                      |      4      |
|    🟡     |        `overrides`         | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": "success",
    "last": {
      "bid": 0.8131,
      "ask": 0.8133,
      "exchange": 48,
      "timestamp": 1587501544000
    },
    "from": "GBP",
    "to": "USD",
    "initialAmount": 1,
    "converted": 1.2299,
    "result": 1.2299
  },
  "result": 1.2299,
  "statusCode": 200
}
```

## Tickers Endpoint
#### Convert a currency or currencies into another currency or currencies
Get FOREX price conversions

### Input Params

| Required? |            Name            |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            |                                 `USD`, `AUD`, `USD`                                  |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currency to convert to          |                                 `CAD`, `EUR`, `USD`                                  |             |                                                              |      4      |
|    🟡     |        `overrides`         | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

## Input
```json
{
    "id": "1",
    "data": {
        "endpoint": "tickers",
        "from": ["USD","CAD"],
        "to": ["EUR","AUD"]
    }
}
```

### Output

```json
{
    "jobRunID": "1",
    "debug": {
        "staleness": 0,
        "performance": 0.138425665,
        "providerCost": 1,
        "batchablePropertyPath": [
            "base",
            "quote"
        ]
    },
    "statusCode": 200,
    "data": {
        "status": "OK",
        "tickers": [
            {
                "day": {
                    "c": 0.67601,
                    "h": 0.67623,
                    "l": 0.6735,
                    "o": 0.67418,
                    "v": 38907
                },
                "lastQuote": {
                    "a": 0.67604,
                    "b": 0.67591,
                    "t": 1627571610000,
                    "x": 48
                },
                "min": {
                    "c": 0.67603,
                    "h": 0.67611,
                    "l": 0.6758949,
                    "o": 0.67605,
                    "v": 41
                },
                "prevDay": {
                    "c": 0.6740361,
                    "h": 0.67452,
                    "l": 0.6713,
                    "o": 0.67179,
                    "v": 60674,
                    "vw": 0
                },
                "ticker": "C:CADEUR",
                "todaysChange": 0.0018739,
                "todaysChangePerc": 0.27801182,
                "updated": 1627571610000000000
            },
            {
                "day": {
                    "c": 1.08515,
                    "h": 1.0866,
                    "l": 1.0822,
                    "o": 1.08257,
                    "v": 49232
                },
                "lastQuote": {
                    "a": 1.08533,
                    "b": 1.08508,
                    "t": 1627571609000,
                    "x": 48
                },
                "min": {
                    "c": 1.08516,
                    "h": 1.08529,
                    "l": 1.08513,
                    "o": 1.08519,
                    "v": 55
                },
                "prevDay": {
                    "c": 1.0826714,
                    "h": 1.0850078,
                    "l": 1.0770436,
                    "o": 1.07803,
                    "v": 77318,
                    "vw": 0
                },
                "ticker": "C:CADAUD",
                "todaysChange": 0.0024086,
                "todaysChangePerc": 0.22246824,
                "updated": 1627571609000000000
            },
            {
                "day": {
                    "c": 1.3501836,
                    "h": 1.358788,
                    "l": 1.348254,
                    "o": 1.35553,
                    "v": 94514
                },
                "lastQuote": {
                    "a": 1.3504207,
                    "b": 1.3503659,
                    "t": 1627571610000,
                    "x": 48
                },
                "min": {
                    "c": 1.3501836,
                    "h": 1.3502019,
                    "l": 1.3497098,
                    "o": 1.3500925,
                    "v": 108
                },
                "prevDay": {
                    "c": 1.3554727,
                    "h": 1.3665869,
                    "l": 1.3504207,
                    "o": 1.3575521,
                    "v": 149220,
                    "vw": 0
                },
                "ticker": "C:USDAUD",
                "todaysChange": -0.0051068,
                "todaysChangePerc": -0.37675418,
                "updated": 1627571610000000000
            },
            {
                "day": {
                    "c": 0.84114,
                    "h": 0.84452,
                    "l": 0.8408,
                    "o": 0.84416,
                    "v": 38848
                },
                "lastQuote": {
                    "a": 0.841184,
                    "b": 0.840972,
                    "t": 1627571609000,
                    "x": 48
                },
                "min": {
                    "c": 0.84114,
                    "h": 0.8411632,
                    "l": 0.840901,
                    "o": 0.8411,
                    "v": 61
                },
                "prevDay": {
                    "c": 0.84414,
                    "h": 0.8494,
                    "l": 0.8437,
                    "o": 0.84596,
                    "v": 63265,
                    "vw": 0
                },
                "ticker": "C:USDEUR",
                "todaysChange": -0.003168,
                "todaysChangePerc": -0.3752932,
                "updated": 1627571609000000000
            }
        ],
        "results": [
            [
                {
                    "id": "1",
                    "data": {
                        "endpoint": "tickers",
                        "base": "CAD",
                        "quote": "EUR"
                    },
                    "rateLimitMaxAge": 2400
                },
                0.67604
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "endpoint": "tickers",
                        "base": "CAD",
                        "quote": "AUD"
                    },
                    "rateLimitMaxAge": 2400
                },
                1.08533
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "endpoint": "tickers",
                        "base": "USD",
                        "quote": "AUD"
                    },
                    "rateLimitMaxAge": 2400
                },
                1.3504207
            ],
            [
                {
                    "id": "1",
                    "data": {
                        "endpoint": "tickers",
                        "base": "USD",
                        "quote": "EUR"
                    },
                    "rateLimitMaxAge": 2400
                },
                0.841184
            ]
        ]
    }
}
```
