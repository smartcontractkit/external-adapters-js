# Chainlink External Adapter for Cache.gold

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cache.gold/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://contract.cache.gold/api

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |              Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://contract.cache.gold/api` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [lockedGold](#lockedgold-endpoint) | `lockedGold` |

## LockedGold Endpoint

Query the total gold grams locked in [cache.gold](https://contract.cache.gold/api/lockedGold).

`lockedGold` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

MIT License
