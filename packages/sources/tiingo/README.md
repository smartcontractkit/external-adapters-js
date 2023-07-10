# TIINGO

![2.1.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tiingo/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |          Description          |  Type  | Options |          Default          |
| :-------: | :-------------: | :---------------------------: | :----: | :-----: | :-----------------------: |
|           |  API_ENDPOINT   |    API endpoint for tiingo    | string |         | `https://api.tiingo.com/` |
|    ✅     |     API_KEY     |      API key for tiingo       | string |         |                           |
|           | WS_API_ENDPOINT | websocket endpoint for tiingo | string |         |  `wss://api.tiingo.com`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                                                                                                                                                             Options                                                                                                                                                                                                                                                                                                                             | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [commodities](#forex-endpoint), [crypto-lwba](#crypto-lwba-endpoint), [crypto-synth](#crypto-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [crypto_lwba](#crypto-lwba-endpoint), [cryptolwba](#crypto-lwba-endpoint), [cryptoyield](#cryptoyield-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [fx](#forex-endpoint), [iex](#iex-endpoint), [price](#crypto-endpoint), [prices](#crypto-endpoint), [realized-vol](#realized-vol-endpoint), [realized-volatility](#realized-vol-endpoint), [stock](#iex-endpoint), [top](#top-endpoint), [volume](#volume-endpoint), [vwap](#vwap-endpoint), [yield](#cryptoyield-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `crypto-synth`, `price`, `prices`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Volume Endpoint

`volume` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Top Endpoint

`top` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

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
    "cacheKey": "XXzVr1BJSz0yu7fS24TstI7/6y8="
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

## Eod Endpoint

`eod` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |        Aliases         |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :--------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ticker | `base`, `coin`, `from` | The stock ticker to query | string |         |         |            |                |

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
    "cacheKey": "rn5jUNNxMYEb+GpB2c3j3OHq7GE="
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

Supported names for this endpoint are: `iex`, `stock`.

### Input Params

| Required? | Name |         Aliases          |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :----------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from`, `ticker` | The stock ticker to query | string |         |         |            |                |

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
    "cacheKey": "pas76xQPJqkVCIB809Lj6oafbX4="
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

## Forex Endpoint

Supported names for this endpoint are: `commodities`, `forex`, `fx`.

### Input Params

| Required? | Name  |          Aliases          |       Description       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :---------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `from`, `market` |   The asset to query    | string |         |         |            |                |
|    ✅     | quote |           `to`            | The quote to convert to | string |         |         |            |                |

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
    "cacheKey": "sA1ClRAaejm61wjO60JmffINysg="
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
    "cacheKey": "SbQFhb2JjSBLEZu27s5Ce6fC27E="
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

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Crypto-lwba Endpoint

Supported names for this endpoint are: `crypto-lwba`, `crypto_lwba`, `cryptolwba`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Cryptoyield Endpoint

Supported names for this endpoint are: `cryptoyield`, `yield`.

### Input Params

| Required? |  Name   | Aliases |  Description   |  Type  |     Options      | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :------------: | :----: | :--------------: | :-----: | :--------: | :------------: |
|    ✅     | aprTerm |         | Yield apr term | string | `30Day`, `90Day` |         |            |                |

### Example

There are no examples for this endpoint.

---

## Realized-vol Endpoint

Supported names for this endpoint are: `realized-vol`, `realized-volatility`.

### Input Params

| Required? |    Name    |    Aliases     |                       Description                        |  Type  | Options |    Default     | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :------------------------------------------------------: | :----: | :-----: | :------------: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |  The base currency to query the realized volatility for  | string |         |                |            |                |
|           |  convert   | `quote`, `to`  | The quote currency to convert the realized volatility to | string |         |     `USD`      |            |                |
|           | resultPath |                |        The field to return within the result path        | string |         | `realVol30Day` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
