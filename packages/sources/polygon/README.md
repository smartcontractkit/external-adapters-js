# Chainlink Polygon External Adapter

![1.4.32](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/polygon/package.json)

This adapter is for [Polygon.io](https://polygon.io/) and supports the conversion endpoint.

Base URL https://api.polygon.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                   Description                                    |  Type  | Options |           Default            |
| :-------: | :----------: | :------------------------------------------------------------------------------: | :----: | :-----: | :--------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://polygon.io/dashboard/signup) | string |         |                              |
|           | API_ENDPOINT |                                                                                  | string |         | `https://api.polygon.io/v1/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                         Options                                                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [conversion](#conversion-endpoint), [forex](#tickers-endpoint), [price](#tickers-endpoint), [tickers](#tickers-endpoint) | `tickers` |

## Tickers Endpoint

Convert a currency or currencies into another currency or currencies

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `tickers` endpoint instead.**

Supported names for this endpoint are: `forex`, `price`, `tickers`.

### Input Params

| Required? |   Name   |    Aliases     | Description | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------: | :---------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `base`, `from` |             |      |         |         |            |                |
|    ✅     |  quote   | `quote`, `to`  |             |      |         |         |            |                |
|           | quantity |                |             |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "tickers",
    "base": "USD",
    "quote": "GBP"
  },
  "debug": {
    "cacheKey": "mHeJ4ndsgJT0zeWSJArS/54XXLQ=",
    "batchCacheKey": "dmCbCvr59JP/HC4lKuMpTIk7QEo=",
    "batchChildrenCacheKeys": [
      [
        "mHeJ4ndsgJT0zeWSJArS/54XXLQ=",
        {
          "id": "1",
          "data": {
            "endpoint": "tickers",
            "base": "USD",
            "quote": "GBP"
          }
        }
      ]
    ]
  },
  "rateLimitMaxAge": 26666
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": "OK",
    "tickers": [
      {
        "day": {
          "c": 28.5,
          "h": 28.58,
          "l": 28.06,
          "o": 28.27,
          "v": 438
        },
        "lastQuote": {
          "a": 28.51,
          "b": 28.5,
          "t": 1641849667000,
          "x": 48
        },
        "min": {
          "c": 28.5,
          "h": 28.5,
          "l": 28.5,
          "o": 28.5,
          "v": 1
        },
        "prevDay": {
          "c": 28.28,
          "h": 28.33,
          "l": 28.22,
          "o": 28.28,
          "v": 20,
          "vw": 28.2965
        },
        "ticker": "C:XAGCAD",
        "todaysChange": 0.22,
        "todaysChangePerc": 0.77793494,
        "updated": 1641849720000000000
      },
      {
        "day": {
          "c": 7.772828,
          "h": 7.818999,
          "l": 7.760693,
          "o": 7.818999,
          "v": 57
        },
        "lastQuote": {
          "a": 7.813152,
          "b": 7.772828,
          "t": 1641848701000,
          "x": 48
        },
        "min": {
          "c": 7.772828,
          "h": 7.772828,
          "l": 7.772828,
          "o": 7.772828,
          "v": 1
        },
        "prevDay": {
          "c": 7.819093,
          "h": 7.819093,
          "l": 7.819093,
          "o": 7.819093,
          "v": 1,
          "vw": 7.8191
        },
        "ticker": "C:DKKPHP",
        "todaysChange": -0.046265,
        "todaysChangePerc": -0.59169267,
        "updated": 1641848760000000000
      },
      {
        "day": {
          "c": 40.044434,
          "h": 40.211215,
          "l": 40.044434,
          "o": 40.211215,
          "v": 2
        },
        "lastQuote": {
          "a": 41.258245,
          "b": 40.044434,
          "t": 1641816559000,
          "x": 48
        },
        "min": {
          "c": 40.044434,
          "h": 40.044434,
          "l": 40.044434,
          "o": 40.044434,
          "v": 1
        },
        "prevDay": {
          "c": 40.180558,
          "h": 40.180558,
          "l": 40.180558,
          "o": 40.180558,
          "v": 1,
          "vw": 40.1806
        },
        "ticker": "C:MXNCLP",
        "todaysChange": -0.136124,
        "todaysChangePerc": -0.33878076,
        "updated": 1641816600000000000
      },
      {
        "day": {
          "c": 0.4977,
          "h": 0.49911,
          "l": 0.4968,
          "o": 0.4984,
          "v": 53622
        },
        "lastQuote": {
          "a": 0.49803,
          "b": 0.49788,
          "t": 1641849768000,
          "x": 48
        },
        "min": {
          "c": 0.49787,
          "h": 0.49788,
          "l": 0.4977,
          "o": 0.49787,
          "v": 27
        },
        "prevDay": {
          "c": 0.49841,
          "h": 0.49881,
          "l": 0.49683,
          "o": 0.49767,
          "v": 3161,
          "vw": 0.4983
        },
        "ticker": "C:NZDGBP",
        "todaysChange": -0.00053,
        "todaysChangePerc": -0.10633816,
        "updated": 1641849768000000000
      },
      {
        "day": {
          "c": 1.3460908,
          "h": 1.3510664,
          "l": 1.3377873,
          "o": 1.3388409,
          "v": 65636
        },
        "lastQuote": {
          "a": 1.3468068,
          "b": 1.3460795,
          "t": 1641849765000,
          "x": 48
        },
        "min": {
          "c": 1.3460908,
          "h": 1.3461386,
          "l": 1.3457874,
          "o": 1.34599,
          "v": 24
        },
        "prevDay": {
          "c": 1.3390283,
          "h": 1.3440112,
          "l": 1.3380308,
          "o": 1.3413942,
          "v": 4116,
          "vw": 1.3402
        },
        "ticker": "C:BWPZAR",
        "todaysChange": 0.0070512,
        "todaysChangePerc": 0.52659081,
        "updated": 1641849765000000000
      },
      {
        "day": {
          "c": 51.19,
          "h": 51.84,
          "l": 50.468,
          "o": 51.332,
          "v": 1964
        },
        "lastQuote": {
          "a": 51.22,
          "b": 51.19,
          "t": 1641849444000,
          "x": 48
        },
        "min": {
          "c": 51.19,
          "h": 51.19,
          "l": 51.19,
          "o": 51.19,
          "v": 1
        },
        "prevDay": {
          "c": 51.201563,
          "h": 51.201563,
          "l": 51.201563,
          "o": 51.201563,
          "v": 1,
          "vw": 51.2016
        },
        "ticker": "C:USDPHP",
        "todaysChange": -0.011563,
        "todaysChangePerc": -0.02258329,
        "updated": 1641849480000000000
      },
      {
        "day": {
          "c": 0.000103,
          "h": 0.000103,
          "l": 0.000103,
          "o": 0.000103,
          "v": 1
        },
        "lastQuote": {
          "a": 0.000104,
          "b": 0.000103,
          "t": 1641793084000,
          "x": 48
        },
        "min": {
          "c": 0.000103,
          "h": 0.000103,
          "l": 0.000103,
          "o": 0.000103,
          "v": 1
        },
        "prevDay": {
          "c": 0.000102,
          "h": 0.000102,
          "l": 0.000102,
          "o": 0.000102,
          "v": 1,
          "vw": 0.0001
        },
        "ticker": "C:IDRNZD",
        "todaysChange": 0.000001,
        "todaysChangePerc": 0.98039216,
        "updated": 1641793140000000000
      },
      {
        "day": {
          "c": 620.89731,
          "h": 620.89731,
          "l": 619.04505,
          "o": 619.04505,
          "v": 2
        },
        "lastQuote": {
          "a": 692.87428,
          "b": 620.89731,
          "t": 1641816557000,
          "x": 48
        },
        "min": {
          "c": 620.89731,
          "h": 620.89731,
          "l": 620.89731,
          "o": 620.89731,
          "v": 1
        },
        "prevDay": {
          "c": 619.61278,
          "h": 619.61278,
          "l": 619.61278,
          "o": 619.61278,
          "v": 1,
          "vw": 619.6128
        },
        "ticker": "C:GBPAMD",
        "todaysChange": 1.28453,
        "todaysChangePerc": 0.20731173,
        "updated": 1641816600000000000
      },
      {
        "day": {
          "c": 50.075,
          "h": 50.075,
          "l": 50.075,
          "o": 50.075,
          "v": 1
        },
        "lastQuote": {
          "a": 51.275,
          "b": 50.075,
          "t": 1641816558000,
          "x": 48
        },
        "min": {
          "c": 50.075,
          "h": 50.075,
          "l": 50.075,
          "o": 50.075,
          "v": 1
        },
        "prevDay": {
          "c": 49.982,
          "h": 49.982,
          "l": 49.982,
          "o": 49.982,
          "v": 1,
          "vw": 49.982
        },
        "ticker": "C:EURUYU",
        "todaysChange": 0.093,
        "todaysChangePerc": 0.18606698,
        "updated": 1641816600000000000
      },
      {
        "day": {
          "c": 0.02723026,
          "h": 0.0272995,
          "l": 0.02677197,
          "o": 0.02692589,
          "v": 2572
        },
        "lastQuote": {
          "a": 0.02725583,
          "b": 0.02722979,
          "t": 1641849761000,
          "x": 48
        },
        "min": {
          "c": 0.02723026,
          "h": 0.02723026,
          "l": 0.02723026,
          "o": 0.02723026,
          "v": 1
        },
        "prevDay": {
          "c": 0.02692566,
          "h": 0.02693999,
          "l": 0.02688926,
          "o": 0.02688926,
          "v": 123,
          "vw": 0.0269
        },
        "ticker": "C:JPYILS",
        "todaysChange": 0.00030413,
        "todaysChangePerc": 1.12951735,
        "updated": 1641849761000000000
      },
      {
        "day": {
          "c": 2.95549,
          "h": 2.963774,
          "l": 2.947906,
          "o": 2.95001,
          "v": 39136
        },
        "lastQuote": {
          "a": 2.95901,
          "b": 2.95555,
          "t": 1641849765000,
          "x": 48
        },
        "min": {
          "c": 2.95597,
          "h": 2.95613,
          "l": 2.9551,
          "o": 2.95597,
          "v": 29
        },
        "prevDay": {
          "c": 2.95012,
          "h": 2.951468,
          "l": 2.93504,
          "o": 2.949354,
          "v": 2446,
          "vw": 2.9458
        },
        "ticker": "C:SGDPLN",
        "todaysChange": 0.00543,
        "todaysChangePerc": 0.18406031,
        "updated": 1641849765000000000
      },
      {
        "day": {
          "c": 1782,
          "h": 1783,
          "l": 1771,
          "o": 1774,
          "v": 1438
        },
        "lastQuote": {
          "a": 1896,
          "b": 1782,
          "t": 1641849673000,
          "x": 48
        },
        "min": {
          "c": 1782,
          "h": 1782,
          "l": 1782,
          "o": 1782,
          "v": 1
        },
        "prevDay": {
          "c": 1761,
          "h": 1761,
          "l": 1761,
          "o": 1761,
          "v": 1,
          "vw": 1761
        },
        "ticker": "C:BRIUSD",
        "todaysChange": 21,
        "todaysChangePerc": 1.19250426,
        "updated": 1641849720000000000
      },
      {
        "day": {
          "c": 0.08052476,
          "h": 0.08062338,
          "l": 0.08042984,
          "o": 0.08051231,
          "v": 83
        },
        "lastQuote": {
          "a": 0.08071435,
          "b": 0.08052476,
          "t": 1641848701000,
          "x": 48
        },
        "min": {
          "c": 0.08052476,
          "h": 0.08052476,
          "l": 0.08052476,
          "o": 0.08052476,
          "v": 1
        },
        "prevDay": {
          "c": 0.08053968,
          "h": 0.08053968,
          "l": 0.08053968,
          "o": 0.08053968,
          "v": 1,
          "vw": 0.0805
        },
        "ticker": "C:SARKWD",
        "todaysChange": -0.00001492,
        "todaysChangePerc": -0.01852503,
        "updated": 1641848760000000000
      },
      {
        "day": {
          "c": 0.00982057,
          "h": 0.00982253,
          "l": 0.00982057,
          "o": 0.00982253,
          "v": 2
        },
        "lastQuote": {
          "a": 0.01005752,
          "b": 0.00982057,
          "t": 1641816559000,
          "x": 48
        },
        "min": {
          "c": 0.00982057,
          "h": 0.00982057,
          "l": 0.00982057,
          "o": 0.00982057,
          "v": 1
        },
        "prevDay": {
          "c": 0.00981353,
          "h": 0.00981353,
          "l": 0.00981353,
          "o": 0.00981353,
          "v": 1,
          "vw": 0.0098
        },
        "ticker": "C:BTNGBP",
        "todaysChange": 0.00000704,
        "todaysChangePerc": 0.07173769,
        "updated": 1641816600000000000
      },
      {
        "day": {
          "c": 11.597951,
          "h": 11.650499,
          "l": 11.518659,
          "o": 11.518659,
          "v": 1870
        },
        "lastQuote": {
          "a": 11.620102,
          "b": 11.597951,
          "t": 1641849721000,
          "x": 48
        },
        "min": {
          "c": 11.59892,
          "h": 11.59892,
          "l": 11.597397,
          "o": 11.597397,
...
```

---

## Conversion Endpoint

Get FOREX price conversions

`conversion` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                 Description                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `from`  |     The symbol of the currency to query      | string |         |         |            |                |
|    ✅     |   quote   |  `to`   |   The symbol of the currency to convert to   | string |         |         |            |                |
|           |  amount   |         |     The amount of the `base` to convert      | number |         |   `1`   |            |                |
|           | precision |         | The number of significant figures to include | number |         |   `6`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "conversion",
    "base": "USD",
    "quote": "GBP",
    "amount": 1,
    "precision": 6
  },
  "debug": {
    "cacheKey": "LSis8oL66JPkLWlEfF1HOR1J8GM="
  },
  "rateLimitMaxAge": 13333
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "converted": 0.7536,
    "from": "USD",
    "initialAmount": 1,
    "last": {
      "ask": 0.7537,
      "bid": 0.7536,
      "exchange": 48,
      "timestamp": 1638296882000
    },
    "request_id": "744873f269fecf272b15c6f665a94438",
    "status": "success",
    "symbol": "USD/GBP",
    "to": "GBP",
    "result": 0.7536
  },
  "result": 0.7536,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
