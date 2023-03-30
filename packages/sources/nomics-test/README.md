# NOMICS

![1.1.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nomics-test/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                                 Description                                 |  Type  | Options |           Default           |
| :-------: | :----------: | :-------------------------------------------------------------------------: | :----: | :-----: | :-------------------------: |
|    ✅     |   API_KEY    | An API key that can be obtained from https://p.nomics.com/pricing#free-plan | string |         |                             |
|           | API_ENDPOINT |                         An API endpoint for nomics                          | string |         | `https://api.nomics.com/v1` |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                              Options                                                                                              | Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [filtered](#filtered-endpoint), [globalmarketcap](#globalmarketcap-endpoint), [marketcap](#marketcap-endpoint), [price](#crypto-endpoint), [volume](#volume-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |          Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |   `coin`, `from`, `ids`   | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Volume Endpoint

`volume` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |          Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |   `coin`, `from`, `ids`   | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Filtered Endpoint

`filtered` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    |       Aliases        |              Description               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------------------: | :------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   base    | `coin`, `from`, `id` |  The symbol of the currency to query   | string |         |         |            |                |
|    ✅     | exchanges |                      | Comma delimited list of exchange names | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Globalmarketcap Endpoint

`globalmarketcap` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

## Marketcap Endpoint

`marketcap` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |          Aliases          |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  |   `coin`, `from`, `ids`   | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `convert`, `market`, `to` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
