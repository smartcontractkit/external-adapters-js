# Chainlink External Adapter for 1Forge

![1.6.28](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/1forge/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.1forge.com/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                        Description                        |  Type  | Options |          Default          |
| :-------: | :----------: | :-------------------------------------------------------: | :----: | :-----: | :-----------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from the 1Forge dashboard | string |         |                           |
|           | API_ENDPOINT |                                                           | string |         | `https://api.1forge.com/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                    Options                                                     | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [convert](#convert-endpoint), [forex](#quotes-endpoint), [price](#quotes-endpoint), [quotes](#quotes-endpoint) | `quotes` |

## Quotes Endpoint

Returns a batched price comparison from a list currencies to a list of other currencies.

[`/quotes`](https://1forge.com/api#quotes) - Convert from one currency to another.

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `quotes` endpoint instead.**

Supported names for this endpoint are: `forex`, `price`, `quotes`.

### Input Params

| Required? | Name  | Aliases |               Description                | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :--------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`  |   The symbol of the currency to query    |      |         |         |            |                |
|    ✅     | quote |  `to`   | The symbol of the currency to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Convert Endpoint

[`/convert`](https://1forge.com/api#convert) - Convert from one currency to another.

`convert` is the only supported name for this endpoint.

### Input Params

| Required? |   Name   | Aliases |                  Description                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :-----: | :-------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base   | `from`  |      The symbol of the currency to query      | string |         |         |            |                |
|    ✅     |  quote   |  `to`   |   The symbol of the currency to convert to    | string |         |         |            |                |
|           | quantity |         | An additional amount of the original currency | number |         |   `1`   |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
