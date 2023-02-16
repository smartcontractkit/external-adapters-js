# Chainlink External Adapter for Tiingo

![1.12.17](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tiingo/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.tiingo.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                  |
|           | API_ENDPOINT |             | string |         | `https://api.tiingo.com/tiingo/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                            Options                                                                                                                                                                                            | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [commodities](#forex-endpoint), [crypto-synth](#prices-endpoint), [crypto-vwap](#cryptovwap-endpoint), [crypto](#prices-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [fx](#forex-endpoint), [iex](#iex-endpoint), [price](#prices-endpoint), [prices](#prices-endpoint), [stock](#iex-endpoint), [top](#top-endpoint), [volume](#prices-endpoint), [vwap](#cryptovwap-endpoint) | `crypto` |

## Eod Endpoint

https://api.tiingo.com/documentation/end-of-day

`eod` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |        Aliases         |        Description        | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :--------------------: | :-----------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ticker | `base`, `coin`, `from` | The stock ticker to query |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "ticker": "usd",
    "endpoint": "eod",
    "resultPath": "close"
  },
  "debug": {
    "cacheKey": "0gx6fGrPny0znqEADWu2A26fvgc="
  },
  "rateLimitMaxAge": 7999
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "adjClose": 48.77,
        "adjHigh": 50.02,
        "adjLow": 45.3,
        "adjOpen": 45.3,
        "adjVolume": 253971,
        "close": 48.77,
        "date": "2021-11-04T00:00:00+00:00",
        "divCash": 0,
        "high": 50.02,
        "low": 45.3,
        "open": 45.3,
        "splitFactor": 1,
        "volume": 253971
      }
    ],
    "result": 48.77
  },
  "result": 48.77,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Iex Endpoint

https://api.tiingo.com/documentation/iex

Supported names for this endpoint are: `iex`, `stock`.

### Input Params

| Required? |  Name  |        Aliases         |        Description        | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :--------------------: | :-----------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ticker | `base`, `coin`, `from` | The stock ticker to query |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "ticker": "aapl",
    "endpoint": "iex",
    "resultPath": "tngoLast"
  },
  "debug": {
    "cacheKey": "SDvITSsCENORfQYpucTxeu6zK1w="
  },
  "rateLimitMaxAge": 15999
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "prevClose": 48.77,
        "last": 51.27,
        "lastSaleTimestamp": "2021-11-05T11:54:23.055122029-04:00",
        "low": 49.68,
        "bidSize": 0,
        "askPrice": 0,
        "open": 49.68,
        "mid": null,
        "volume": 680,
        "lastSize": 80,
        "tngoLast": 51.27,
        "ticker": "AAPL",
        "askSize": 0,
        "quoteTimestamp": "2021-11-05T11:54:23.055122029-04:00",
        "bidPrice": 0,
        "timestamp": "2021-11-05T11:54:23.055122029-04:00",
        "high": 51.345
      }
    ],
    "result": 51.27
  },
  "result": 51.27,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Top Endpoint

The top of order book endpoint from https://api.tiingo.com/documentation/crypto

`top` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                Description                 | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :----------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |     The cryptocurrency symbol to query     |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | The output currency to return the price in |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD",
    "endpoint": "top",
    "resultPath": "lastPrice"
  },
  "debug": {
    "cacheKey": "R/+oWEtyjnuPLKZDzvcW8wq2oPk="
  },
  "rateLimitMaxAge": 31999
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "topOfBookData": [
          {
            "lastSizeNotional": 447.19,
            "lastSaleTimestamp": "2021-11-05T15:58:34.551417+00:00",
            "bidExchange": "KRAKEN",
            "lastPrice": 4471.9,
            "bidSize": 0.8815,
            "askPrice": 4465.77,
            "lastSize": 0.1,
            "lastExchange": "KRAKEN",
            "askSize": 0.67187449,
            "quoteTimestamp": "2021-11-05T15:58:53.024522+00:00",
            "bidPrice": 4471.9,
            "askExchange": "BITTREX"
          }
        ],
        "quoteCurrency": "usd",
        "baseCurrency": "eth",
        "ticker": "ethusd"
      }
    ],
    "result": 4471.9
  },
  "result": 4471.9,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Prices Endpoint

The `crypto`, `volume`, and `prices` endpoints come from https://api.tiingo.com/documentation/crypto.

`crypto` and `prices` endpoints return a VWAP of all the exchanges on the current day and across base tokens.

`volume` returns the 24h volume for a pair.

Supported names for this endpoint are: `crypto`, `crypto-synth`, `price`, `prices`, `volume`.

### Input Params

| Required? | Name  |    Aliases     |                Description                 | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :----------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |     The cryptocurrency symbol to query     |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | The output currency to return the price in |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD",
    "endpoint": "prices",
    "resultPath": "fxClose"
  },
  "debug": {
    "cacheKey": "ahHlkw91jTnrwUAG+KEXi9Uio5Y="
  },
  "rateLimitMaxAge": 24000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "ticker": "ethusd",
        "baseCurrency": "eth",
        "quoteCurrency": "usd",
        "priceData": [
          {
            "open": 4480.102875037304,
            "high": 4587.688720578152,
            "low": 4417.835408304461,
            "close": 4462.5193860735335,
            "volume": 917488.0172696838,
            "tradesDone": 2567528,
            "volumeNotional": 4094298121.291589,
            "fxOpen": 4480.102875037304,
            "fxHigh": 4587.688720578152,
            "fxLow": 4417.835408304461,
            "fxClose": 4462.5193860735335,
            "fxVolumeNotional": 4094298121.291589,
            "fxRate": 1
          }
        ]
      }
    ],
    "result": 4462.5193860735335
  },
  "result": 4462.5193860735335,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD",
    "endpoint": "volume",
    "resultPath": "volumeNotional"
  },
  "debug": {
    "cacheKey": "uylgVIQKV/L+6zgVaUjEMfzoh40="
  },
  "rateLimitMaxAge": 39999
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "ticker": "ethusd",
        "baseCurrency": "eth",
        "quoteCurrency": "usd",
        "priceData": [
          {
            "open": 4480.102875037304,
            "high": 4587.688720578152,
            "low": 4417.835408304461,
            "close": 4462.5193860735335,
            "volume": 917488.0172696838,
            "tradesDone": 2567528,
            "volumeNotional": 4094298121.291589,
            "fxOpen": 4480.102875037304,
            "fxHigh": 4587.688720578152,
            "fxLow": 4417.835408304461,
            "fxClose": 4462.5193860735335,
            "fxVolumeNotional": 4094298121.291589,
            "fxRate": 1
          }
        ]
      }
    ],
    "result": 4094298121.291589
  },
  "result": 4094298121.291589,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

## Forex Endpoint

https://api.tiingo.com/documentation/forex
This endpoint has the ability to leverage inverses in the scenario a specific pair exists but not its inverse on the Tiingo forex API.

Supported names for this endpoint are: `commodities`, `forex`, `fx`.

### Input Params

| Required? | Name  |          Aliases          |       Description       | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :---------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `from`, `market` |   The asset to query    |      |         |         |            |                |
|    ✅     | quote |           `to`            | The quote to convert to |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "GBP",
    "quote": "USD",
    "endpoint": "forex",
    "resultPath": "midPrice"
  },
  "debug": {
    "cacheKey": "nNGTBPQMuNeDIBcqHmoSuDeMaVw="
  },
  "rateLimitMaxAge": 48000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "ticker": "gbpusd",
        "quoteTimestamp": "2021-11-23T15:13:39.472000+00:00",
        "bidPrice": 1.31418,
        "bidSize": 1000000,
        "askPrice": 1.35792,
        "askSize": 1000000,
        "midPrice": 1.33605
      }
    ],
    "result": 1.33605
  },
  "result": 1.33605,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "base": "USOIL",
    "quote": "USD",
    "endpoint": "commodities",
    "resultPath": "midPrice"
  },
  "debug": {
    "cacheKey": "p1BAwN7XZ74iOPHKeVwq2euuWe8="
  },
  "rateLimitMaxAge": 56000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "ticker": "usoilusd",
        "quoteTimestamp": "2021-11-23T15:14:45.768000+00:00",
        "bidPrice": 77.45,
        "bidSize": 1000000,
        "askPrice": 77.58,
        "askSize": 1000000,
        "midPrice": 77.515
      }
    ],
    "result": 77.515
  },
  "result": 77.515,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

## CryptoVwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? | Name  |    Aliases     | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |             | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |             | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "AMPL",
    "quote": "USD",
    "endpoint": "crypto-vwap",
    "resultPath": "fxClose"
  },
  "debug": {
    "cacheKey": "pWgCN8xv36qP+Lu3H/SD71Pup88="
  },
  "rateLimitMaxAge": 63999
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "ticker": "amplusd",
        "baseCurrency": "ampl",
        "quoteCurrency": "usd",
        "priceData": [
          {
            "fxLow": 0.6687492814959118,
            "volume": 3040820.8077948317,
            "volumeNotional": 2156262.1333203353,
            "close": 0.7091192957589304,
            "tradesDone": 15128,
            "fxRate": 1,
            "open": 0.7253618170091394,
            "date": "2022-01-10T00:00:00+00:00",
            "low": 0.6687492814959118,
            "fxOpen": 0.7253618170091394,
            "fxClose": 0.7091192957589304,
            "high": 0.7421611700495103,
            "fxVolumeNotional": 2156262.1333203353,
            "fxHigh": 0.7421611700495103
          },
          {
            "fxLow": 0.7021978513298123,
            "volume": 3046332.756485964,
            "volumeNotional": 2594073.9097942426,
            "close": 0.851625908515737,
            "tradesDone": 22817,
            "fxRate": 1,
            "open": 0.708183339731143,
            "date": "2022-01-11T00:00:00+00:00",
            "low": 0.7021978513298123,
            "fxOpen": 0.708183339731143,
            "fxClose": 0.851625908515737,
            "high": 0.8598988101118933,
            "fxVolumeNotional": 2594073.9097942426,
            "fxHigh": 0.8598988101118933
          }
        ]
      }
    ],
    "result": 0.7091192957589304
  },
  "result": 0.7091192957589304,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
