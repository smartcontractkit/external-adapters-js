# COINGECKO

![1.6.6](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coingecko-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description             |  Type  | Options | Default |
| :-------: | :----------: | :--------------------------------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT | The HTTP URL to retrieve data from | string |         |         |
|           |   API_KEY    |     Optional Coingecko API key     | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                                                                              Options                                                                                                                                                                                                                                               | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [batch](#crypto-endpoint), [batched](#crypto-endpoint), [coins](#coins-endpoint), [crypto-batched](#crypto-endpoint), [crypto-marketcap](#marketcap-endpoint), [crypto-volume](#volume-endpoint), [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [market_cap_percentage](#dominance-endpoint), [marketcap](#marketcap-endpoint), [price](#crypto-endpoint), [total_market_cap](#globalmarketcap-endpoint), [volume](#volume-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `batch`, `batched`, `crypto`, `crypto-batched`, `price`.

### Input Params

| Required? |  Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | coinid |                |           The Coingecko id to query            | string |         |         |            |                |
|           |  base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

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

## Marketcap Endpoint

Supported names for this endpoint are: `crypto-marketcap`, `marketcap`.

### Input Params

| Required? |  Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | coinid |                |           The Coingecko id to query            | string |         |         |            |                |
|           |  base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Volume Endpoint

Supported names for this endpoint are: `crypto-volume`, `volume`.

### Input Params

| Required? |  Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | coinid |                |           The Coingecko id to query            | string |         |         |            |                |
|           |  base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Dominance Endpoint

Supported names for this endpoint are: `dominance`, `market_cap_percentage`.

### Input Params

| Required? |  Name  |    Aliases    |           Description           | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :-----------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The ticker of the coin to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Globalmarketcap Endpoint

Supported names for this endpoint are: `globalmarketcap`, `total_market_cap`.

### Input Params

| Required? |  Name  |    Aliases    |           Description           | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :-----------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The ticker of the coin to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
