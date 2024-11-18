# FINAGE

![2.0.16](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/finage/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Hardcoded Feeds

Outside of overrides defined in the standard [overrides.json](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/finage/src/config/overrides.json) file, the Finage EA has some custom hardcoded logic.

### Forex Endpoint - Transport Routing & Assets

The `forex` endpoint includes custom logic for routing [certain assets](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/finage/src/endpoint/forex.ts#L44) to REST.

Additionally, many forex assets quoted in USD are inversed. [This](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/finage/src/endpoint/forex.ts#L19) is a map of assets excluded from this inverse logic; all other /USD pairs should be considered as inverse pairs.

### Crypto Endpoint - Asset Transport routing

Similarly, for the `crypto` endpoint, [these asset pairs](https://github.com/smartcontractkit/external-adapters-js/blob/main/packages/sources/finage/src/endpoint/crypto.ts#L9-L18) are routed to REST only.

## Environment Variables

| Required? |          Name          |                               Description                               |  Type   | Options |              Default              |
| :-------: | :--------------------: | :---------------------------------------------------------------------: | :-----: | :-----: | :-------------------------------: |
|           |      API_ENDPOINT      |                         API endpoint for Finage                         | string  |         |    `https://api.finage.co.uk`     |
|    ✅     |        API_KEY         |   An API key that can be obtained from the data provider's dashboard    | string  |         |                                   |
|    ✅     |     WS_SOCKET_KEY      | A WEBSOCKET key that can be obtained from the data provider's dashboard | string  |         |                                   |
|           | STOCK_WS_API_ENDPOINT  |           The Websocket endpoint to connect to for stock data           | string  |         | `wss://e4s39ar3mr.finage.ws:7002` |
|           | FOREX_WS_API_ENDPOINT  |           The Websocket endpoint to connect to for forex data           | string  |         | `wss://w29hxx2ndd.finage.ws:8001` |
|           | CRYPTO_WS_API_ENDPOINT |          The Websocket endpoint to connect to for crypto data           | string  |         | `wss://72x8wsyx7t.finage.ws:6008` |
|           |  ETF_WS_API_ENDPOINT   |            The Websocket endpoint to connect to for etf data            | string  |         | `wss://8umh1cipe9.finage.ws:9001` |
|           |       WS_ENABLED       |          Whether data should be returned from websocket or not          | boolean |         |              `false`              |

---

## Data Provider Rate Limits

|              Name               | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----------------------------: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| professionalstocksusstockmarket |             100             |                             |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                         Options                                                                                                         | Default |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#commodities-endpoint), [crypto](#crypto-endpoint), [eod](#eod-endpoint), [etf](#etf-endpoint), [forex](#forex-endpoint), [price](#crypto-endpoint), [stock](#stock-endpoint), [uk_etf](#uk_etf-endpoint) | `stock` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |         Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |      `market`, `to`      |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto",
    "base": "BTC",
    "quote": "USD"
  }
}
```

---

## Stock Endpoint

`stock` is the only supported name for this endpoint.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock",
    "base": "AAPL"
  }
}
```

---

## Eod Endpoint

`eod` is the only supported name for this endpoint.

### Input Params

| Required? | Name |     Aliases      |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `symbol` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "eod",
    "base": "ETH"
  }
}
```

---

## Commodities Endpoint

`commodities` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |         Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |      `market`, `to`      |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "commodities",
    "base": "WTI",
    "quote": "USD"
  }
}
```

---

## Forex Endpoint

`forex` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |         Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote |      `market`, `to`      |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "forex",
    "base": "GBP",
    "quote": "USD"
  }
}
```

---

## Uk_etf Endpoint

`uk_etf` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |     Aliases      |          Description           |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :--------------: | :----------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base   | `from`, `symbol` | The symbol of the etf to query | string |         |         |            |                |
|           | country |                  |          Country code          | string |         |  `uk`   |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "uk_etf",
    "base": "CSPX",
    "country": "uk"
  }
}
```

---

## Etf Endpoint

`etf` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |     Aliases      |          Description           |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :--------------: | :----------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base   | `from`, `symbol` | The symbol of the etf to query | string |         |         |            |                |
|           | country |                  |          Country code          | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "etf",
    "base": "C3M"
  }
}
```

---

MIT License
