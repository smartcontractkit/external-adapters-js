# Chainlink External Adapter for Nomics

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nomics/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

An API key that can be obtained from [here](https://p.nomics.com/pricing#free-plan)

Base URL https://api.nomics.com/v1

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                     Description                                     |  Type  | Options |           Default           |
| :-------: | :----------: | :---------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://p.nomics.com/pricing#free-plan) | string |         |                             |
|           | API_ENDPOINT |                                                                                     | string |         | `https://api.nomics.com/v1` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                            Options                                                                                             | Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [filtered](#filtered-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint) | `crypto` |

## Globalmarketcap Endpoint

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

## Crypto Endpoint

The `crypto` endpoint fetches the price of a requested asset, the `marketcap` endpoint fetches the market cap of the requested asset, and the `volume` endpoint fetches the volume of the requested pair of assets for past 24-hr.

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? | Name  |          Aliases          |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |   `coin`, `from`, `ids`   |   The symbol of the currency to query    |      |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` | The symbol of the currency to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Filtered Endpoint

Fetches the price of an asset using specified exchanges.

`filtered` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    |       Aliases        |              Description               | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------------: | :------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `coin`, `from`, `id` |  The symbol of the currency to query   |      |         |         |            |                |
|    ✅     | exchanges |                      | Comma delimited list of exchange names |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
