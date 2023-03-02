# Chainlink Open Exchange Rates External Adapter

![1.5.21](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/openexchangerates/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://openexchangerates.org/api/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                    Description                                    |  Type  | Options |               Default                |
| :-------: | :----------: | :-------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://openexchangerates.org/signup) | string |         |                                      |
|           | API_ENDPOINT |                                                                                   | string |         | `https://openexchangerates.org/api/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [price](#forex-endpoint) | `forex` |

## Forex Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `forex` endpoint instead.**

Supported names for this endpoint are: `forex`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
