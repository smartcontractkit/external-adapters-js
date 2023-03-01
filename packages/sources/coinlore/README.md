# Chainlink External Adapter for Coin Lore

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinlore/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://api.coinlore.net/api

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                            Options                                             |   Default   |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [dominance](#global-endpoint), [global](#global-endpoint), [globalmarketcap](#global-endpoint) | `dominance` |

## Global Endpoint

Supported names for this endpoint are: `dominance`, `global`, `globalmarketcap`.

### Input Params

| Required? | Name | Aliases |                                  Description                                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :----------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | base |         | When using a field of `d`, the currency to prefix the field with (e.g. `usd_d` | string |         |  `btc`  |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
