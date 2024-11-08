# Chainlink CoinApi External Adapter

![1.3.26](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinapi/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://rest.coinapi.io/v1/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                 Description                                 |  Type  | Options |            Default            |
| :-------: | :-------------: | :-------------------------------------------------------------------------: | :----: | :-----: | :---------------------------: |
|           |  API_ENDPOINT   |                                                                             | string |         | `https://rest.coinapi.io/v1/` |
|    ✅     |     API_KEY     | An API key that can be obtained from [here](https://www.coinapi.io/pricing) | string |         |                               |
|           | WS_API_ENDPOINT |                                                                             | string |         |   `wss://ws.coinapi.io/v1/`   |

---

## Data Provider Rate Limits

|     Name     | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :----------: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
|     free     |                             |                             |           4.16            |      |
|   startup    |                             |                             |           41.66           |      |
|   streamer   |                             |                             |          416.66           |      |
| professional |                             |                             |          4166.66          |      |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                      Options                                      | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [assets](#assets-endpoint), [crypto](#crypto-endpoint), [price](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                          Description                           |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of the currency to query [crypto](#Crypto-Endpoint) | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |            The symbol of the currency to convert to            |        |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "BTC",
    "quote": "EUR",
    "endpoint": "crypto"
  },
  "debug": {
    "cacheKey": "Q8XOjOIavMitS4H7vXDU0zCQDPI=",
    "batchCacheKey": "v5neWkqA0RYlYjzOHUo7QNYFiSI=",
    "batchChildrenCacheKeys": [
      [
        "Q8XOjOIavMitS4H7vXDU0zCQDPI=",
        {
          "id": "1",
          "data": {
            "base": "BTC",
            "quote": "EUR",
            "endpoint": "crypto"
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
    "asset_id_base": "BTC",
    "rates": [
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset_id_quote": "EUR",
        "rate": 22978.232093447674
      }
    ],
    "result": 22978.232093447674
  },
  "result": 22978.232093447674,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "quote"
      }
    ]
  },
  "providerStatusCode": 200
}
```

---

## Assets Endpoint

`assets` is the only supported name for this endpoint.

### Input Params

| Required? | Name |    Aliases     |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from` | The symbol of the currency to convert to |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "endpoint": "assets",
    "resultPath": "price_usd"
  },
  "debug": {
    "cacheKey": "Ur/htdfKFQCEg9u3OP04uh/3KH4=",
    "batchCacheKey": "bw8uI6H3Mcl4otBbQjQdDzp3KUA=",
    "batchChildrenCacheKeys": [
      [
        "Ur/htdfKFQCEg9u3OP04uh/3KH4=",
        {
          "id": "1",
          "data": {
            "base": "ETH",
            "endpoint": "assets",
            "resultPath": "price_usd"
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
    "payload": [
      {
        "asset_id": "ETH",
        "name": "Ethereum",
        "type_is_crypto": 1,
        "data_quote_start": "2015-08-07T14:50:38.1774950Z",
        "data_quote_end": "2022-01-10T18:45:03.3682903Z",
        "data_orderbook_start": "2015-08-07T14:50:38.1774950Z",
        "data_orderbook_end": "2020-08-05T14:38:33.4327540Z",
        "data_trade_start": "2015-08-07T15:21:48.1062520Z",
        "data_trade_end": "2022-01-10T18:44:24.5080000Z",
        "data_symbols_count": 61012,
        "volume_1hrs_usd": 298165681760.79,
        "volume_1day_usd": 6964865921209.1,
        "volume_1mth_usd": 6100863678584647,
        "price_usd": 3043.673871176232,
        "id_icon": "604ae453-3d9f-4ad0-9a48-9905cce617c2",
        "data_start": "2015-08-07",
        "data_end": "2022-01-10"
      }
    ],
    "result": 3043.673871176232
  },
  "result": 3043.673871176232,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base"
      }
    ]
  },
  "providerStatusCode": 200
}
```

---

MIT License
