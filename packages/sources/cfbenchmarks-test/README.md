# CFBENCHMARKS

![1.3.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cfbenchmarks-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                  Options                                                  | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [birc](#birc-endpoint), [crypto](#crypto-endpoint), [price](#crypto-endpoint), [values](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`, `values`.

### Input Params

| Required? | Name  |    Aliases     |                            Description                             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :----------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | index |                | The ID of the index. Takes priority over base/quote when provided. | string |         |         |            |                |
|           | base  | `coin`, `from` |           The symbol of symbols of the currency to query           | string |         |         |            |                |
|           | quote | `market`, `to` |              The symbol of the currency to convert to              | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Birc Endpoint

`birc` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                  Description                  |  Type  |                        Options                         | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :-------------------------------------------: | :----: | :----------------------------------------------------: | :-----: | :--------: | :------------: |
|    ✅     | tenor |         | The tenor value to pull from the API response | string | `1M`, `1W`, `2M`, `2W`, `3M`, `3W`, `4M`, `5M`, `SIRB` |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
