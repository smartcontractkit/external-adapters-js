# CRYPTOCOMPARE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptocompare-test/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                              Description                              |  Type  | Options |                Default                |
| :-------: | :-------------: | :-------------------------------------------------------------------: | :----: | :-----: | :-----------------------------------: |
|    ✅     |  API_ENDPOINT   |                  The HTTP URL to retrieve data from                   | string |         |  `https://min-api.cryptocompare.com`  |
|    ✅     | WS_API_ENDPOINT |                   The WS URL to retrieve data from                    | string |         | `wss://streamer.cryptocompare.com/v2` |
|    ✅     |     API_KEY     |                       The CryptoCompare API key                       | string |         |                                       |
|           |   WS_API_KEY    | The websocket API key to authenticate with, if different from API_KEY | string |         |                                       |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                     Options                                                                     | Default  |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto-ws](#crypto-endpoint), [crypto](#crypto-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `crypto-ws`, `marketcap`, `price`, `volume`.

### Input Params

| Required? |   Name   |        Aliases         |                  Description                   |  Type  |                        Options                        | Default  | Depends On | Not Valid With |
| :-------: | :------: | :--------------------: | :--------------------------------------------: | :----: | :---------------------------------------------------: | :------: | :--------: | :------------: |
|    ✅     |   base   | `coin`, `from`, `fsym` | The symbol of symbols of the currency to query | string |                                                       |          |            |                |
|    ✅     |  quote   | `market`, `to`, `tsym` |    The symbol of the currency to convert to    | string |                                                       |          |            |                |
|           | endpoint |                        |                                                | string | `crypto`, `crypto-ws`, `marketcap`, `price`, `volume` | `crypto` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
