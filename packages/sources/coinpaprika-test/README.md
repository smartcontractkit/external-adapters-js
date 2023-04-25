# COINPAPRIKA

![1.2.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinpaprika-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description             |  Type  | Options | Default |
| :-------: | :----------: | :--------------------------------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT | The HTTP URL to retrieve data from | string |         |         |
|           |   API_KEY    |     An API key for Coinpaprika     | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                         Options                                                                                                                                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [coins](#coins-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [dominance](#globalmarketcap-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? |    Name    |    Aliases     |                              Description                               |  Type  |            Options             | Default | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :--------------------------------------------------------------------: | :----: | :----------------------------: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |             The symbol of symbols of the currency to query             | string |                                |         |            |                |
|    ✅     |   quote    | `market`, `to` |                The symbol of the currency to convert to                | string |                                |         |            |                |
|           |   coinid   |                |            The coin ID (optional to use in place of `base`)            | string |                                |         |            |                |
|           | resultPath |                | The path to the result within the asset quote in the provider response | string | `marketcap`, `price`, `volume` |         |            |                |

### Example

There are no examples for this endpoint.

---

## Globalmarketcap Endpoint

Supported names for this endpoint are: `dominance`, `globalmarketcap`.

### Input Params

| Required? |    Name    |    Aliases    |                              Description                               |  Type  |            Options             | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----------: | :--------------------------------------------------------------------: | :----: | :----------------------------: | :-----: | :--------: | :------------: |
|    ✅     |   market   | `quote`, `to` |                The symbol of the currency to convert to                | string |                                |         |            |                |
|           | resultPath |               | The path to the result within the asset quote in the provider response | string | `dominance`, `globalmarketcap` |         |            |                |

### Example

There are no examples for this endpoint.

---

## Coins Endpoint

`coins` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? |  Name  |    Aliases     |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |                                                  | string |         |         |            |                |
|           | hours  |                |         Number of hours to get VWAP for          | number |         |  `24`   |            |                |
|           | coinid |                | The coin ID (optional to use in place of `base`) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
