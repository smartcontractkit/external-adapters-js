# POLYGON

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/polygon-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                   Description                                    |  Type  | Options |         Default          |
| :-------: | :----------: | :------------------------------------------------------------------------------: | :----: | :-----: | :----------------------: |
|           | API_ENDPOINT |                        The HTTP URL to retrieve data from                        | string |         | `https://api.polygon.io` |
|    ✅     |   API_KEY    | An API key that can be obtained from [here](https://polygon.io/dashboard/signup) | string |         |                          |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                         Options                                                          |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [conversion](#conversion-endpoint), [forex](#tickers-endpoint), [price](#tickers-endpoint), [tickers](#tickers-endpoint) | `tickers` |

## Tickers Endpoint

Supported names for this endpoint are: `forex`, `price`, `tickers`.

### Input Params

| Required? | Name  |    Aliases     |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Conversion Endpoint

`conversion` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                 Description                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `from`  |     The symbol of the currency to query      | string |         |         |            |                |
|    ✅     |   quote   |  `to`   |   The symbol of the currency to convert to   | string |         |         |            |                |
|           |  amount   |         |     The amount of the `base` to convert      | number |         |   `1`   |            |                |
|           | precision |         | The number of significant figures to include | number |         |   `6`   |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
