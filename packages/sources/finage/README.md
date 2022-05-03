# Chainlink External Adapter for Finage

![1.3.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/finage/package.json)

Base URL https://api.finage.co.uk

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name          |                               Description                               |  Type  | Options |              Default              |
| :-------: | :--------------------: | :---------------------------------------------------------------------: | :----: | :-----: | :-------------------------------: |
|    ✅     |        API_KEY         |   An API key that can be obtained from the data provider's dashboard    | string |         |                                   |
|           |     WS_SOCKET_KEY      | A WEBSOCKET key that can be obtained from the data provider's dashboard | string |         |                                   |
|           | STOCK_WS_API_ENDPOINT  |           The Websocket endpoint to connect to for stock data           | string |         | `wss://e4s39ar3mr.finage.ws:7002` |
|           | FOREX_WS_API_ENDPOINT  |           The Websocket endpoint to connect to for forex data           | string |         | `wss://w29hxx2ndd.finage.ws:8001` |
|           | CRYPTO_WS_API_ENDPOINT |          The Websocket endpoint to connect to for crypto data           | string |         | `wss://72x8wsyx7t.finage.ws:6008` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                               Options                                                | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [stock](#stock-endpoint) | `stock` |

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

MIT License
