# TIINGO

![1.4.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tiingo-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |          Description          |  Type  | Options |          Default          |
| :-------: | :-------------: | :---------------------------: | :----: | :-----: | :-----------------------: |
|           |  API_ENDPOINT   |    API endpoint for tiingo    | string |         | `https://api.tiingo.com/` |
|    ✅     |     API_KEY     |      API key for tiingo       | string |         |                           |
|           | WS_API_ENDPOINT | websocket endpoint for tiingo | string |         |  `wss://api.tiingo.com`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                                                                                                                                                          Options                                                                                                                                                                                                                                                                                                          | Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [commodities](#forex-endpoint), [crypto-synth](#crypto-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [crypto_lwba](#crypto_lwba-endpoint), [cryptolwba](#crypto_lwba-endpoint), [cryptoyield](#cryptoyield-endpoint), [eod](#eod-endpoint), [forex](#forex-endpoint), [fx](#forex-endpoint), [iex](#iex-endpoint), [price](#crypto-endpoint), [prices](#crypto-endpoint), [realized-vol](#realized-vol-endpoint), [realized-volatility](#realized-vol-endpoint), [stock](#iex-endpoint), [top](#top-endpoint), [volume](#volume-endpoint), [vwap](#vwap-endpoint), [yield](#cryptoyield-endpoint) | `crypto` |

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

## Crypto_lwba Endpoint

Supported names for this endpoint are: `crypto_lwba`, `cryptolwba`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Cryptoyield Endpoint

Supported names for this endpoint are: `cryptoyield`, `yield`.

### Input Params

| Required? |  Name   | Aliases |  Description   |  Type  |     Options      | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :------------: | :----: | :--------------: | :-----: | :--------: | :------------: |
|    ✅     | aprTerm |         | Yield apr term | string | `30day`, `90day` |         |            |                |

### Example

There are no examples for this endpoint.

---

## Realized-vol Endpoint

Supported names for this endpoint are: `realized-vol`, `realized-volatility`.

### Input Params

| Required? |    Name    |    Aliases     |                       Description                        |  Type  | Options |    Default     | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :------------------------------------------------------: | :----: | :-----: | :------------: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |  The base currency to query the realized volatility for  | string |         |                |            |                |
|           |  convert   | `quote`, `to`  | The quote currency to convert the realized volatility to | string |         |     `USD`      |            |                |
|           | resultPath |                |        The field to return within the result path        | string |         | `realVol30Day` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
