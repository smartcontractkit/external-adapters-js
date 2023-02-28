# Chainlink Fixer External Adapter

![2.0.19](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/fixer/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This adapter is for [Fixer.io](https://fixer.io/) and supports the convert endpoint.

Base URL https://data.fixer.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |         Default         |
| :-------: | :----------: | :---------: | :----: | :-----: | :---------------------: |
|    ✅     |   API_KEY    |             | string |         |                         |
|           | API_ENDPOINT |             | string |         | `https://data.fixer.io` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                    Options                                                     | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#latest-endpoint), [latest](#latest-endpoint), [price](#latest-endpoint) | `latest` |

## Convert Endpoint

`convert` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote  | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |
|           | amount |                |      The amount of `base` currency       | number |         |   `1`   |            |                |

### Example

There are no examples for this endpoint.

---

## Latest Endpoint

Returns a batched price comparison from one currency to a list of other currencies.

Supported names for this endpoint are: `forex`, `latest`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to |        |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
