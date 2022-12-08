# COINGECKO

![1.3.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coingecko-test/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                                                                                   Options                                                                                                                                                                                                                                                   | Default  |
| :-------: | :------: | :-----------------: | :----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [batch](#crypto-endpoint), [batched](#crypto-endpoint), [coins](#coins-endpoint), [crypto-batched](#crypto-endpoint), [crypto-marketcap](#cryptomarketcap-endpoint), [crypto-volume](#cryptovolume-endpoint), [cryptoMarketcap](#cryptomarketcap-endpoint), [cryptoVolume](#cryptovolume-endpoint), [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalMarketcap](#globalmarketcap-endpoint), [market_cap_percentage](#dominance-endpoint), [total_market_cap](#globalmarketcap-endpoint) | `crypto` |

## Coins Endpoint

`coins` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

## Crypto Endpoint

Supported names for this endpoint are: `batch`, `batched`, `crypto`, `crypto-batched`.

### Input Params

| Required? |   Name    |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           |  coinid   |                |          The CoinGecko id or to query          | string |         |         |            |                |
|           |   base    | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     |   quote   | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |
|           | precision |                |             Data precision setting             |        |         | `full`  |            |                |

### Example

There are no examples for this endpoint.

---

## CryptoMarketcap Endpoint

Supported names for this endpoint are: `crypto-marketcap`, `cryptoMarketcap`.

### Input Params

| Required? |   Name    |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           |  coinid   |                |          The CoinGecko id or to query          | string |         |         |            |                |
|           |   base    | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     |   quote   | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |
|           | precision |                |             Data precision setting             |        |         | `full`  |            |                |

### Example

There are no examples for this endpoint.

---

## GlobalMarketcap Endpoint

Supported names for this endpoint are: `globalMarketcap`, `total_market_cap`.

### Input Params

| Required? |  Name  |    Aliases    |           Description           | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :-----------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The ticker of the coin to query |      |         |         |            |                |

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

## CryptoVolume Endpoint

Supported names for this endpoint are: `crypto-volume`, `cryptoVolume`.

### Input Params

| Required? |   Name    |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           |  coinid   |                |          The CoinGecko id or to query          | string |         |         |            |                |
|           |   base    | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     |   quote   | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |
|           | precision |                |             Data precision setting             |        |         | `full`  |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
