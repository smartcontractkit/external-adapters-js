# TRADERMADE

![1.2.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tradermade-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                           Description                                           |  Type   | Options |                     Default                     |
| :-------: | :-------------: | :---------------------------------------------------------------------------------------------: | :-----: | :-----: | :---------------------------------------------: |
|           |  API_ENDPOINT   |                                   API endpoint for tradermade                                   | string  |         | `https://marketdata.tradermade.com/api/v1/live` |
|    ✅     |     API_KEY     | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) | string  |         |                                                 |
|           |   WS_API_KEY    | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) | string  |         |                                                 |
|           | WS_API_ENDPOINT |                       The Websocket endpoint to connect to for forex data                       | string  |         |    `wss://marketdata.tradermade.com/feedadv`    |
|           |   WS_ENABLED    |                      Whether data should be returned from websocket or not                      | boolean |         |                     `false`                     |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                              Options                                                               | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [batch](#forex-endpoint), [commodities](#live-endpoint), [forex](#forex-endpoint), [live](#live-endpoint), [stock](#live-endpoint) | `live`  |

## Forex Endpoint

Supported names for this endpoint are: `batch`, `forex`.

### Input Params

| Required? | Name  |          Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `symbol`  | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Live Endpoint

Supported names for this endpoint are: `commodities`, `live`, `stock`.

### Input Params

| Required? | Name  |              Aliases               |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `market`, `symbol` | The symbol of symbols of the currency to query | string |         |         |            |                |
|           | quote |          `convert`, `to`           |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
