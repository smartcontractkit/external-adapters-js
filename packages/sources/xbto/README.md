# Chainlink External Adapter for XBTO

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/xbto/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Base URL https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options | Default |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT |             |        |         |         |
|    ✅     |   API_KEY    |             | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases | Description |  Type  |    Options     | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :---------: | :----: | :------------: | :-----: | :--------: | :------------: |
|           | market |         |             | string | `brent`, `wti` | `brent` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
