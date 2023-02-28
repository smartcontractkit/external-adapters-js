# Chainlink External Adapter for [MetalsAPI](https://metals-api.com/documentation#convertcurrency)

![1.7.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/metalsapi/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://metals-api.com/api/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |            Default            |
| :-------: | :----------: | :---------: | :----: | :-----: | :---------------------------: |
|    ✅     |   API_KEY    |             | string |         |                               |
|           | API_ENDPOINT |             | string |         | `https://metals-api.com/api/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                       Options                                        | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#convert-endpoint), [latest](#latest-endpoint) | `forex` |

## Convert Endpoint

Supported names for this endpoint are: `convert`, `forex`.

### Input Params

| Required? |  Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  base  | `coin`, `from` |   The symbol of the currency to query    |        |         |         |            |                |
|    ✅     | quote  | `market`, `to` | The symbol of the currency to convert to |        |         |         |            |                |
|           | amount |                |    The amount of the `base` currency     | number |         |   `1`   |            |                |

### Example

There are no examples for this endpoint.

---

## Latest Endpoint

Returns a batched price comparison from one currency to a list of other currencies.

`latest` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to |        |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
