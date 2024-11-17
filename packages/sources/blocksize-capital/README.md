# BLOCKSIZE_CAPITAL

![2.3.10](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/blocksize-capital/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description             |  Type  | Options |                     Default                     |
| :-------: | :-------------: | :--------------------------------: | :----: | :-----: | :---------------------------------------------: |
|    ✅     |     API_KEY     |   The Blocksize Capital API key    | string |         |                                                 |
|           | WS_API_ENDPOINT | The default WebSocket API base url | string |         | `wss://data.blocksize.capital/marketdata/v1/ws` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                           Options                                                                                                           | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [crypto-lwba](#crypto-lwba-endpoint), [crypto-vwap](#vwap-endpoint), [crypto](#price-endpoint), [crypto_lwba](#crypto-lwba-endpoint), [cryptolwba](#crypto-lwba-endpoint), [price](#price-endpoint), [vwap](#vwap-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "ETH",
    "quote": "EUR"
  }
}
```

---

## Crypto-lwba Endpoint

Supported names for this endpoint are: `crypto-lwba`, `crypto_lwba`, `cryptolwba`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "crypto-lwba",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "vwap",
    "base": "AMPL",
    "quote": "USD"
  }
}
```

---

MIT License
