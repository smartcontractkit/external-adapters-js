# OPENEXCHANGERATES

![1.0.6](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/openexchangerates-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                    Description                                    |  Type  | Options |               Default                |
| :-------: | :----------: | :-------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------: |
|           | API_ENDPOINT |                        API endpoint for OpenExchangeRates                         | string |         | `https://openexchangerates.org/api/` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://openexchangerates.org/signup) | string |         |                                      |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [forex](#forex-endpoint), [price](#forex-endpoint) | `forex` |

## Forex Endpoint

Supported names for this endpoint are: `forex`, `price`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
