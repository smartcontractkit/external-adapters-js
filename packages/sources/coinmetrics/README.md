# Chainlink External Adapter for Coinmetrics

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmetrics/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

### Websocket support

This adapter supports Websockets. Due to the design of the API, each unique pair will be opened as a separate connection on the WS API. This may cause unexpected behaviour for a large number of unique pairs.

Supported DateTime formats: `yyyy-MM-dd`, `yyyyMMdd`, `yyyy-MM-ddTHH:mm:ss`, `yyyy-MM-ddTHHmmss`, `yyyy-MM-ddTHH:mm:ss.SSS`, `yyyy-MM-ddTHHmmss.SSS`, `yyyy-MM-ddTHH:mm:ss.SSSSSS`, `yyyy-MM-ddTHHmmss.SSSSSS`, `yyyy-MM-ddTHH:mm:ss.SSSSSSSSS`, `yyyy-MM-ddTHHmmss.SSSSSSSSS`

Base URL https://api.coinmetrics.io/v4

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                            Description                             |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                           Options                                           | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [burned](#burned-endpoint), [price](#price-endpoint), [total-burned](#totalburned-endpoint) | `price` |

## Price Endpoint

Endpoint to get the reference price of the asset.

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Burned Endpoint

Endpoint to calculate the number of burned coins/tokens for an asset either on the previous day or on the previous block.
This endpoint requires that the asset has the following metrics available: `FeeTotNtv`, `RevNtv` and `IssTotNtv`.

`burned` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                                               Description                                               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :-----------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   asset   |         | The symbol of the currency to query. See [Coin Metrics Assets](https://docs.coinmetrics.io/info/assets) | string |         |         |            |                |
|           | frequency |         |                    At which interval to calculate the number of coins/tokens burned                     | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## TotalBurned Endpoint

Endpoint to calculate the total number of burned coins/tokens for an asset.
This endpoint requires that the asset has the following metrics available: `FeeTotNtv`, `RevNtv` and `IssTotNtv`.

`total-burned` is the only supported name for this endpoint.

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
