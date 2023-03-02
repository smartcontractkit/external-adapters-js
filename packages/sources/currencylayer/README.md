# Chainlink External Adapter for CurrencyLayer

![2.0.19](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/currencylayer/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.currencylayer.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                  Description                                   |  Type  | Options |             Default             |
| :-------: | :----------: | :----------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://currencylayer.com/product) | string |         |                                 |
|           | API_ENDPOINT |                                                                                | string |         | `https://api.currencylayer.com` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                Options                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#live-endpoint), [live](#live-endpoint), [price](#live-endpoint) | `live`  |

## Convert Endpoint

`convert` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |
|           | amount |                |        An amount of the currency         | number |         |   `1`   |            |                |

### Example

There are no examples for this endpoint.

---

## Live Endpoint

Returns a batched price comparison from one currency to a list of other currencies.

Supported names for this endpoint are: `forex`, `live`, `price`.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` | The symbol of the currency to convert to |        |         |         |            |                |
|           | amount |                |        An amount of the currency         | number |         |   `1`   |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
