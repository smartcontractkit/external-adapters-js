# CRYPTOCOMPARE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptocompare-test/package.json)

Base URL wss://streamer.cryptocompare.com/v2

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

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                             Options                                                                                             | Default  |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto-ws](#cryptoendpoint-endpoint), [cryptoEndpoint](#cryptoendpoint-endpoint), [marketcap](#cryptoendpoint-endpoint), [price](#cryptoendpoint-endpoint), [volume](#cryptoendpoint-endpoint) | `crypto` |

## CryptoEndpoint Endpoint

Supported names for this endpoint are: `crypto-ws`, `cryptoEndpoint`, `marketcap`, `price`, `volume`.

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
