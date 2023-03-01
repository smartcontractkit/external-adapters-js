# Chainlink External Adapter for Tiingo

![1.12.17](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tiingo/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.tiingo.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |             Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                  |
|           | API_ENDPOINT |             | string |         | `https://api.tiingo.com/tiingo/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                            Options                                                                                                                                                                                            | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [commodities](#forex-endpoint), [crypto-synth](#prices-endpoint), [crypto-vwap](#cryptovwap-endpoint), [crypto](#prices-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [fx](#forex-endpoint), [iex](#iex-endpoint), [price](#prices-endpoint), [prices](#prices-endpoint), [stock](#iex-endpoint), [top](#top-endpoint), [volume](#prices-endpoint), [vwap](#cryptovwap-endpoint) | `crypto` |

## Eod Endpoint

https://api.tiingo.com/documentation/end-of-day

`eod` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |        Aliases         |        Description        | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :--------------------: | :-----------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ticker | `base`, `coin`, `from` | The stock ticker to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Iex Endpoint

https://api.tiingo.com/documentation/iex

Supported names for this endpoint are: `iex`, `stock`.

### Input Params

| Required? |  Name  |        Aliases         |        Description        | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :--------------------: | :-----------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ticker | `base`, `coin`, `from` | The stock ticker to query |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Top Endpoint

The top of order book endpoint from https://api.tiingo.com/documentation/crypto

`top` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                Description                 | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :----------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |     The cryptocurrency symbol to query     |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | The output currency to return the price in |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Prices Endpoint

The `crypto`, `volume`, and `prices` endpoints come from https://api.tiingo.com/documentation/crypto.

`crypto` and `prices` endpoints return a VWAP of all the exchanges on the current day and across base tokens.

`volume` returns the 24h volume for a pair.

Supported names for this endpoint are: `crypto`, `crypto-synth`, `price`, `prices`, `volume`.

### Input Params

| Required? | Name  |    Aliases     |                Description                 | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :----------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |     The cryptocurrency symbol to query     |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | The output currency to return the price in |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Forex Endpoint

https://api.tiingo.com/documentation/forex
This endpoint has the ability to leverage inverses in the scenario a specific pair exists but not its inverse on the Tiingo forex API.

Supported names for this endpoint are: `commodities`, `forex`, `fx`.

### Input Params

| Required? | Name  |          Aliases          |       Description       | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :---------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `from`, `market` |   The asset to query    |      |         |         |            |                |
|    ✅     | quote |           `to`            | The quote to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## CryptoVwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? | Name  |    Aliases     | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |             | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |             | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
