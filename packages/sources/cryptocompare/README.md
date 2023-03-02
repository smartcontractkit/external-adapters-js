# Chainlink External Adapter for CryptoCompare

![1.4.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptocompare/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL wss://streamer.cryptocompare.com/v2

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                                      Description                                       |  Type  | Options | Default |
| :-------: | :-----: | :------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://min-api.cryptocompare.com/pricing) | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                 Options                                                                                 | Default  |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? | Name  |        Aliases         |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `fsym` |   The symbol of the currency to query    |      |         |         |            |                |
|    ✅     | quote | `market`, `to`, `tsym` | The symbol of the currency to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? | Name  |        Aliases         |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `fsym` |   The symbol of the currency to query    |        |         |         |            |                |
|    ✅     | quote | `market`, `to`, `tsym` | The symbol of the currency to convert to |        |         |         |            |                |
|           | hours |                        |     Number of hours to get VWAP for      | number |         |  `24`   |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
