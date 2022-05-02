# Chainlink External Adapter for dxFeed

![1.2.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dxfeed/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |         Description          |  Type  | Options |                  Default                   |
| :-------: | :----------: | :--------------------------: | :----: | :-----: | :----------------------------------------: |
|    ✅     | API_USERNAME |                              | string |         |                                            |
|    ✅     | API_PASSWORD |                              | string |         |                                            |
|           | API_ENDPOINT | The endpoint for your dxFeed | string |         | `https://tools.dxfeed.com/webservice/rest` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                 Options                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#price-endpoint), [crypto](#price-endpoint), [forex](#price-endpoint), [price](#price-endpoint), [stock](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `commodities`, `crypto`, `forex`, `price`, `stock`.

### Input Params

| Required? | Name |         Aliases          |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `market` | The symbol of the currency to query |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "resultPath": ["Trade", "TSLA", "price"],
    "base": "TSLA"
  },
  "debug": {
    "cacheKey": "DknAM1fQfWVHGPdFmvbGtNRNaVI=",
    "batchCacheKey": "kZiBWu5BzEiUauh4lmvzs5ipAJ0=",
    "batchChildrenCacheKeys": [
      [
        "0Dhmfcxw8Az9FYLUzbWcuccPozo=",
        {
          "id": "1",
          "data": {
            "endpoint": "price",
            "resultPath": "Trade",
            "base": "TSLA"
          }
        }
      ]
    ]
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": "OK",
    "Trade": {
      "TSLA:BFX": {
        "eventSymbol": "TSLA:BFX",
        "eventTime": 0,
        "time": 1636744209248,
        "timeNanoPart": 0,
        "sequence": 775394,
        "exchangeCode": "V",
        "price": 239.255,
        "change": 0.03,
        "size": 3,
        "dayVolume": 700004,
        "dayTurnover": 167577930,
        "tickDirection": "ZERO_UP",
        "extendedTradingHours": false
      }
    },
    "result": 239.255
  },
  "result": 239.255,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base",
        "limit": 120
      }
    ]
  },
  "providerStatusCode": 200
}
```

---

MIT License
