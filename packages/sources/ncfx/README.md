# NCFX

![4.1.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ncfx/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |             Name              |                        Description                        |  Type  | Options |                             Default                              |
| :-------: | :---------------------------: | :-------------------------------------------------------: | :----: | :-----: | :--------------------------------------------------------------: |
|           |         API_USERNAME          |             Username for the NCFX Crypto API              | string |         |                                                                  |
|           |         API_PASSWORD          |             Password for the NCFX Crypto API              | string |         |                                                                  |
|           |       FOREX_WS_API_KEY        |           API key for Forex websocket endpoint            | string |         |                                                                  |
|           |        WS_API_ENDPOINT        |    The WS API endpoint to use for the crypto endpoint     | string |         |              `wss://cryptofeed.ws.newchangefx.com`               |
|           |     FOREX_WS_API_ENDPOINT     |     The WS API endpoint to use for the forex endpoint     | string |         |         `wss://fiat.ws.newchangefx.com/sub/fiat/ws/ref`          |
|           | MARKET_STATUS_WS_API_ENDPOINT | The WS API endpoint to use for the market status endpoint | string |         | `wss://fiat.ws.newchangefx.com/general/reference/v1/markethours` |
|           |   MARKET_STATUS_WS_API_KEY    |   The WS API key to use for the market status endpoint    | string |         |                                                                  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                                                                   Options                                                                                                                                                                   | Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto-lwba](#crypto-lwba-endpoint), [crypto](#crypto-endpoint), [crypto_lwba](#crypto-lwba-endpoint), [cryptolwba](#crypto-lwba-endpoint), [forex-market-status](#market-status-endpoint), [forex](#forex-endpoint), [market-status](#market-status-endpoint), [metals-market-status](#market-status-endpoint), [price](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

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
    "endpoint": "crypto",
    "base": "ETH",
    "quote": "USD"
  }
}
```

---

## Forex Endpoint

`forex` is the only supported name for this endpoint.

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
    "endpoint": "forex",
    "base": "CAD",
    "quote": "USD"
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

## Market-status Endpoint

Supported names for this endpoint are: `forex-market-status`, `market-status`, `metals-market-status`.

### Input Params

| Required? |  Name  | Aliases |      Description       |  Type  |      Options      | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :--------------------: | :----: | :---------------: | :-----: | :--------: | :------------: |
|    ✅     | market |         | The name of the market | string | `forex`, `metals` |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
