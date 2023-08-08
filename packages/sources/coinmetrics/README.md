# COINMETRICS

![3.2.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmetrics/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description            |  Type  | Options |             Default             |
| :-------: | :-------------: | :-------------------------------: | :----: | :-----: | :-----------------------------: |
|    ✅     |     API_KEY     |      The coinmetrics API key      | string |         |                                 |
|           | WS_API_ENDPOINT | The websocket url for coinmetrics | string |         |  `wss://api.coinmetrics.io/v4`  |
|           |  API_ENDPOINT   |    The API url for coinmetrics    | string |         | `https://api.coinmetrics.io/v4` |

---

## Data Provider Rate Limits

|   Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-------: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| community |                             |             100             |                           |      |
|   paid    |             300             |                             |                           |      |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                                                                Options                                                                                                                                | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [burned](#burned-endpoint), [crypto-lwba](#crypto-lwba-endpoint), [crypto](#price-endpoint), [crypto_lwba](#crypto-lwba-endpoint), [cryptolwba](#crypto-lwba-endpoint), [price-ws](#price-endpoint), [price](#price-endpoint), [total-burned](#total-burned-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `price`, `price-ws`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  |          Options           | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :------------------------: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |                            |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string | `BTC`, `ETH`, `EUR`, `USD` |         |            |                |

### Example

There are no examples for this endpoint.

---

## Crypto-lwba Endpoint

Supported names for this endpoint are: `crypto-lwba`, `crypto_lwba`, `cryptolwba`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Total-burned Endpoint

`total-burned` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                                               Description                                               |  Type  |  Options   | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :-----------------------------------------------------------------------------------------------------: | :----: | :--------: | :-----: | :--------: | :------------: |
|    ✅     |   asset   |         | The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets) | string |            |         |            |                |
|           | frequency |         |                    At which interval to calculate the number of coins/tokens burned                     | string | `1b`, `1d` |  `1d`   |            |                |
|           | pageSize  |         |                           Number of results to get per page. From 1 to 10000                            | number |            | `10000` |            |                |

### Example

There are no examples for this endpoint.

---

## Burned Endpoint

`burned` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                                               Description                                               |  Type  |  Options   | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :-----------------------------------------------------------------------------------------------------: | :----: | :--------: | :-----: | :--------: | :------------: |
|    ✅     |   asset   |         | The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets) | string |            |         |            |                |
|           | frequency |         |                    At which interval to calculate the number of coins/tokens burned                     | string | `1b`, `1d` |  `1d`   |            |                |
|           | pageSize  |         |                           Number of results to get per page. From 1 to 10000                            | number |            | `10000` |            |                |
|           | startTime |         |  The start time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)   | string |            |         |            |                |
|           |  endTime  |         |   The end time for the queried period. See [Supported DateTime Formats](#supported-datetime-formats)    | string |            |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
