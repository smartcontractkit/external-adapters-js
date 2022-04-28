# Chainlink CoinApi External Adapter

![1.1.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinapi/package.json)

Base URL https://rest.coinapi.io/v1/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                 Description                                 |  Type  | Options |            Default            |
| :-------: | :-------------: | :-------------------------------------------------------------------------: | :----: | :-----: | :---------------------------: |
|           |  API_ENDPOINT   |                                                                             | string |         | `https://rest.coinapi.io/v1/` |
|    ✅     |     API_KEY     | An API key that can be obtained from [here](https://www.coinapi.io/pricing) | string |         |                               |
|           | WS_API_ENDPOINT |                                                                             | string |         |   `wss://ws.coinapi.io/v1/`   |

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
|    ✅     | quote | `market`, `to` |            The symbol of the currency to convert to            | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": null,
    "base": "ETH",
    "quote": "BTC"
  },
  "debug": {
    "cacheKey": "/0p7oZyBNGEdy5lSEifn7tRP5fo="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "time": "2021-10-20T21:34:13.0000000Z",
    "asset_id_base": "ETH",
    "asset_id_quote": "BTC",
    "rate": 0.06262119731705901,
    "src_side_base": [
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "USD",
        "rate": 4130.920428943168,
        "volume": 1437597011.9454098
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "CRV",
        "rate": 4134.223003575778,
        "volume": 114844.02873468095
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "LTC",
        "rate": 4132.005563094254,
        "volume": 8300406.170517101
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "LINK",
        "rate": 4130.201752938671,
        "volume": 7634164.440058745
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "COMP",
        "rate": 4135.157427532214,
        "volume": 21805.121100908087
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "BCH",
        "rate": 4133.353696186021,
        "volume": 394639.0026662097
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "SOL",
        "rate": 4132.5584690711,
        "volume": 6339704.149342569
      }
    ],
    "src_side_quote": [
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "BCH",
        "rate": 65960.69010238037,
        "volume": 14710209.422543585
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "USD",
        "rate": 65965.62216035613,
        "volume": 2443120210.702457
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "LTC",
        "rate": 65983.70034772085,
        "volume": 67204310.06307392
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "USDT",
        "rate": 65967.02360607093,
        "volume": 3697483694.522163
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "LINK",
        "rate": 65942.43330622705,
        "volume": 37465995.71905391
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "ETH",
        "rate": 65967.7896543631,
        "volume": 741511928.5841917
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "ZRX",
        "rate": 65938.92692127981,
        "volume": 1813312.1101375392
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "CRV",
        "rate": 65977.836834669,
        "volume": 5662319.783619506
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "SOL",
        "rate": 65979.34501657759,
        "volume": 181906739.5759162
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "MKR",
        "rate": 65957.92478239627,
        "volume": 3556388.2021378465
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "COMP",
        "rate": 65991.46831486505,
        "volume": 4030003.0095703383
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "BAT",
        "rate": 65991.95159110446,
        "volume": 2934758.4841358624
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "STORJ",
        "rate": 65984.25842843138,
        "volume": 1760596.0831881808
      },
      {
        "time": "2021-10-20T21:34:13.0000000Z",
        "asset": "ENJ",
        "rate": 65960.1573448127,
        "volume": 3654081.174457365
      }
    ],
    "result": 0.06262119731705901
  },
  "result": 0.06262119731705901,
  "statusCode": 200,
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
    "endpoint": "assets",
    "resultPath": "price_usd",
    "base": "ETH"
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
            "endpoint": "assets",
            "resultPath": "price_usd",
            "base": "ETH"
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
