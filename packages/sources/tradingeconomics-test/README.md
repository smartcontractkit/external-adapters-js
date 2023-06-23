# TRADINGECONOMICS

![1.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tradingeconomics-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |                      Description                      |  Type   | Options |                  Default                   |
| :-------: | :---------------: | :---------------------------------------------------: | :-----: | :-----: | :----------------------------------------: |
|           |   API_ENDPOINT    |          The HTTP URL to retrieve data from           | string  |         | `https://api.tradingeconomics.com/markets` |
|           |  WS_API_ENDPOINT  |           The WS URL to retrieve data from            | string  |         |    `wss://stream.tradingeconomics.com/`    |
|    ✅     |  API_CLIENT_KEY   |          The TradingEconomics API client key          | string  |         |                                            |
|    ✅     | API_CLIENT_SECRET |        The TradingEconomics API client secret         | string  |         |                                            |
|           |    WS_ENABLED     | Whether data should be returned from websocket or not | boolean |         |                  `false`                   |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                 Options                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#stock-endpoint), [crypto](#price-endpoint), [forex](#price-endpoint), [price](#price-endpoint), [stock](#stock-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `forex`, `price`.

### Input Params

| Required? | Name  |         Aliases         |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :---------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `term`, `to`  |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Stock Endpoint

Supported names for this endpoint are: `commodities`, `stock`.

### Input Params

| Required? | Name |         Aliases         |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :---------------------: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from` | The symbol of the asset to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
