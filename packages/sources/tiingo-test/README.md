# TIINGO

![1.1.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tiingo-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                      Options                                                                                                                                                                                      | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [commodities](#forex-endpoint), [crypto-synth](#crypto-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [fx](#forex-endpoint), [iex](#iex-endpoint), [price](#crypto-endpoint), [prices](#crypto-endpoint), [stock](#iex-endpoint), [top](#top-endpoint), [volume](#volume-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `crypto-synth`, `price`, `prices`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Volume Endpoint

`volume` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Top Endpoint

`top` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Eod Endpoint

`eod` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |        Aliases         |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :--------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ticker | `base`, `coin`, `from` | The stock ticker to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Iex Endpoint

Supported names for this endpoint are: `iex`, `stock`.

### Input Params

| Required? |  Name  |        Aliases         |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :--------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ticker | `base`, `coin`, `from` | The stock ticker to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Forex Endpoint

Supported names for this endpoint are: `commodities`, `forex`, `fx`.

### Input Params

| Required? | Name  |          Aliases          |       Description       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :---------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `from`, `market` |   The asset to query    | string |         |         |            |                |
|    ✅     | quote |           `to`            | The quote to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
