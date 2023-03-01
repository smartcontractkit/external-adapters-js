# Chainlink External Adapter for Coinmarketcap

![1.5.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmarketcap/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                                 Description                                 |  Type  | Options | Default |
| :-------: | :-----: | :-------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://coinmarketcap.com/api/) | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                               Options                                                                                                                | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [historical](#historical-endpoint), [marketcap](#crypto-endpoint), [price](#crypto-endpoint), [volume](#crypto-endpoint) | `crypto` |

## Dominance Endpoint

https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest

`dominance` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Crypto Endpoint

https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `marketcap`, `price`, `volume`.

### Input Params

| Required? |  Name   |             Aliases             |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----------------------------: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base   | `coin`, `from`, `sym`, `symbol` |        The symbol of the currency to query         |        |         |         |            |                |
|    ✅     | convert |     `market`, `quote`, `to`     |      The symbol of the currency to convert to      |        |         |         |            |                |
|           |   cid   |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |
|           |  slug   |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## GlobalMarketCap Endpoint

https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Historical Endpoint

https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical

`historical` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |             Aliases             |                                   Description                                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----------------------------: | :-----------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    base     | `coin`, `from`, `sym`, `symbol` |                       The symbol of the currency to query                       | string |         |         |            |                |
|    ✅     |   convert   |     `market`, `quote`, `to`     |                    The symbol of the currency to convert to                     | string |         |         |            |                |
|           |    start    |                                 |           Timestamp (Unix or ISO 8601) to start returning quotes for            | string |         |         |            |                |
|           |     end     |                                 |            Timestamp (Unix or ISO 8601) to stop returning quotes for            | string |         |         |            |                |
|           |    count    |                                 |              The number of interval periods to return results for               | number |         |  `10`   |            |                |
|           |  interval   |                                 |                   Interval of time to return data points for                    | string |         |  `5m`   |            |                |
|           |     cid     |                                 |               The CMC coin ID (optional to use in place of base)                | string |         |         |            |                |
|           |     aux     |                                 | Optionally specify a comma-separated list of supplemental data fields to return | string |         |         |            |                |
|           | skipInvalid |                                 |                                                                                 | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
