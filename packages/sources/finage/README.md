# Chainlink External Adapter for Finage

![1.6.13](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/finage/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

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

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                  Options                                                                   | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#commodities-endpoint), [crypto](#crypto-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [stock](#stock-endpoint) | `stock` |

## Stock Endpoint

https://finage.co.uk/docs/api/stock-last-quote
The result will be calculated as the midpoint between the ask and the bid.

`stock` is the only supported name for this endpoint.

### Input Params

| Required? | Name |     Aliases      |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `symbol` | The symbol of the currency to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Eod Endpoint

https://finage.co.uk/docs/api/stock-market-previous-close

`eod` is the only supported name for this endpoint.

### Input Params

| Required? | Name |     Aliases      |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :--------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `from`, `symbol` | The symbol of the currency to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

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

There are no examples for this endpoint.

---

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |     Aliases      |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `symbol` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote |  `market`, `to`  | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

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

There are no examples for this endpoint.

---

MIT License
