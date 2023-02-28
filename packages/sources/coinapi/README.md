# Chainlink CoinApi External Adapter

![1.3.17](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinapi/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://rest.coinapi.io/v1/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                 Description                                 |  Type  | Options |            Default            |
| :-------: | :-------------: | :-------------------------------------------------------------------------: | :----: | :-----: | :---------------------------: |
|           |  API_ENDPOINT   |                                                                             | string |         | `https://rest.coinapi.io/v1/` |
|    ✅     |     API_KEY     | An API key that can be obtained from [here](https://www.coinapi.io/pricing) | string |         |                               |
|           | WS_API_ENDPOINT |                                                                             | string |         |   `wss://ws.coinapi.io/v1/`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                      Options                                      | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [assets](#assets-endpoint), [crypto](#crypto-endpoint), [price](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                          Description                           |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of the currency to query [crypto](#Crypto-Endpoint) | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |            The symbol of the currency to convert to            |        |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Assets Endpoint

`assets` is the only supported name for this endpoint.

### Input Params

| Required? | Name |    Aliases     |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from` | The symbol of the currency to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
