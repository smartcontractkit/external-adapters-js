# COINMARKETCAP

![1.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinmarketcap-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                                                 Options                                                                                                                 | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [dominance](#dominance-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [historical](#historical-endpoint), [marketcap](#marketcap-endpoint), [price](#crypto-endpoint), [volume](#volume-endpoint) | `crypto` |

## Globalmarketcap Endpoint

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Dominance Endpoint

`dominance` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases    |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | market | `quote`, `to` | The symbol of the currency to query | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Historical Endpoint

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

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |             Aliases             |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------------: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `sym`, `symbol` |   The symbol of symbols of the currency to query   | string |         |         |            |                |
|    ✅     | quote |    `convert`, `market`, `to`    |      The symbol of the currency to convert to      | string |         |         |            |                |
|           |  cid  |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |
|           | slug  |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Marketcap Endpoint

`marketcap` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |             Aliases             |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------------: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `sym`, `symbol` |   The symbol of symbols of the currency to query   | string |         |         |            |                |
|    ✅     | quote |    `convert`, `market`, `to`    |      The symbol of the currency to convert to      | string |         |         |            |                |
|           |  cid  |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |
|           | slug  |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Volume Endpoint

`volume` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |             Aliases             |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------------: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `sym`, `symbol` |   The symbol of symbols of the currency to query   | string |         |         |            |                |
|    ✅     | quote |    `convert`, `market`, `to`    |      The symbol of the currency to convert to      | string |         |         |            |                |
|           |  cid  |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |
|           | slug  |                                 | The CMC coin ID (optional to use in place of base) | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
