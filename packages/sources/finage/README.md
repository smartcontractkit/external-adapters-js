# Chainlink External Adapter for Finage

![1.10.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/finage/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.finage.co.uk

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name          |                               Description                               |  Type  | Options |              Default              |
| :-------: | :--------------------: | :---------------------------------------------------------------------: | :----: | :-----: | :-------------------------------: |
|    ✅     |        API_KEY         |   An API key that can be obtained from the data provider's dashboard    | string |         |                                   |
|    ✅     |     WS_SOCKET_KEY      | A WEBSOCKET key that can be obtained from the data provider's dashboard | string |         |                                   |
|           | STOCK_WS_API_ENDPOINT  |           The Websocket endpoint to connect to for stock data           | string |         | `wss://e4s39ar3mr.finage.ws:7002` |
|           | FOREX_WS_API_ENDPOINT  |           The Websocket endpoint to connect to for forex data           | string |         | `wss://w29hxx2ndd.finage.ws:8001` |
|           | CRYPTO_WS_API_ENDPOINT |          The Websocket endpoint to connect to for crypto data           | string |         | `wss://72x8wsyx7t.finage.ws:6008` |
|           |  ETF_WS_API_ENDPOINT   |            The Websocket endpoint to connect to for etf data            | string |         | `wss://8umh1cipe9.finage.ws:9001` |

---

## Data Provider Rate Limits

|              Name               | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |     Note      |
| :-----------------------------: | :-------------------------: | :-------------------------: | :-----------------------: | :-----------: |
| professionalstocksusstockmarket |                             |                             |            -1             | No rate limit |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                           Options                                                                                           | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#commodities-endpoint), [crypto](#crypto-endpoint), [eod](#eod-endpoint), [etf](#etf-endpoint), [forex](#forex-endpoint), [stock](#stock-endpoint), [uk_etf](#uketf-endpoint) | `stock` |

## Stock Endpoint

https://finage.co.uk/docs/api/stock-last-quote
The result will be calculated as the midpoint between the ask and the bid.

`stock` is the only supported name for this endpoint.

### Input Params

| Required? | Name |     Aliases      |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `symbol` | The symbol of the currency to query |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "stock",
    "base": "AAPL"
  },
  "debug": {
    "cacheKey": "316c164b35ef3dc21075d5a230fbbdba1a73b311"
  },
  "rateLimitMaxAge": 60000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "AAPL",
    "ask": 26.32,
    "bid": 25.8,
    "asize": 13,
    "bsize": 1,
    "timestamp": 1628899200621,
    "result": 25.8
  },
  "result": 25.8,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Eod Endpoint

https://finage.co.uk/docs/api/stock-market-previous-close

`eod` is the only supported name for this endpoint.

### Input Params

| Required? | Name |     Aliases      |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `symbol` | The symbol of the currency to query |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "eod",
    "base": "ETH"
  },
  "debug": {
    "cacheKey": "44e2057382241c2f567f384645031f2261009e9f"
  },
  "rateLimitMaxAge": 60000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "ETH",
    "totalResults": 1,
    "results": [
      {
        "o": 26.79,
        "h": 26.85,
        "l": 26.02,
        "c": 26.3,
        "v": 367009,
        "t": 1628884800000
      }
    ],
    "result": 26.3
  },
  "result": 26.3,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Forex Endpoint

https://finage.co.uk/docs/api/forex-last-quote
The result will be calculated as the midpoint between the ask and the bid.

`forex` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |     Aliases      |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `symbol` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote |  `market`, `to`  | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "forex",
    "from": "GBP",
    "to": "USD"
  },
  "debug": {
    "cacheKey": "c61cfb94c8737ab068fded47bc6ae05eff279194"
  },
  "rateLimitMaxAge": 60000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "GBPUSD",
    "ask": 1.34435,
    "bid": 1.34426,
    "timestamp": 1637060382000,
    "result": 1.3443049999999999
  },
  "result": 1.3443049999999999,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |     Aliases      |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `symbol` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote |  `market`, `to`  | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "from": "BTC",
    "to": "USD"
  },
  "debug": {
    "cacheKey": "331717863b8c81a60435eeac184715e70176128e"
  },
  "rateLimitMaxAge": 60000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "BTCUSD",
    "price": 50940.12,
    "timestamp": 1638898619885,
    "result": 50940.12
  },
  "result": 50940.12,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Commodities Endpoint

https://finage.co.uk/docs/api/forex-last-trade
The result will be the price of the commodity in the currency specified

`commodities` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |     Aliases      |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `symbol` |   The symbol of the commodity to query   | string |         |         |            |                |
|    ✅     | quote |  `market`, `to`  | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "commodities",
    "from": "WTI",
    "to": "USD"
  },
  "debug": {
    "cacheKey": "de5717c8bde755478b8e999850e8e8cb7d8f0165"
  },
  "rateLimitMaxAge": 60000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "WTIUSD",
    "price": 98.91,
    "timestamp": 1659017220,
    "result": 98.91
  },
  "result": 98.91,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## UkEtf Endpoint

https://finage.co.uk/docs/api/etf-last-price
The result will be the price field in response.

`uk_etf` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |     Aliases      |          Description           | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :--------------: | :----------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base   | `from`, `symbol` | The symbol of the etf to query |      |         |         |            |                |
|           | country |                  |          Country code          |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "uk_etf",
    "base": "IBTA"
  },
  "debug": {
    "cacheKey": "8c633d2d30519e3782eab8b90be59e7cd35bdbe8"
  },
  "rateLimitMaxAge": 60000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "IBTA",
    "price": 5.276,
    "timestamp": 1684403239105,
    "result": 5.276
  },
  "result": 5.276,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Etf Endpoint

https://finage.co.uk/docs/api/etf-last-price
The result will be the price field in response.

`etf` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |     Aliases      |          Description           | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :--------------: | :----------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base   | `from`, `symbol` | The symbol of the etf to query |      |         |         |            |                |
|           | country |                  |          Country code          |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "etf",
    "base": "IBTA",
    "country": "uk"
  },
  "debug": {
    "cacheKey": "aa6ce6cc584450db899dd840b24bf24118612ced"
  },
  "rateLimitMaxAge": 60000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "IBTA",
    "price": 5.276,
    "timestamp": 1684403239105,
    "result": 5.276
  },
  "result": 5.276,
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
    "endpoint": "etf",
    "base": "C3M"
  },
  "debug": {
    "cacheKey": "0d9256e97e16ac94e4fd9561e32092741958cef4"
  },
  "rateLimitMaxAge": 60000
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "C3M",
    "price": 117.38,
    "timestamp": 1684403239105,
    "result": 117.38
  },
  "result": 117.38,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---

MIT License
