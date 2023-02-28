# Chainlink External Adapter for Lido

![2.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/lido/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

By default fetches the value of stMATIC/USD

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |        Description         |  Type  | Options | Default |
| :-------: | :--------------: | :------------------------: | :----: | :-----: | :-----: |
|    ✅     | POLYGON_RPC_URL  |      Polygon RPC URL       | string |         |         |
|           | POLYGON_CHAIN_ID | The chain id to connect to | string |         |  `137`  |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [stmatic](#stmatic-endpoint) | `stmatic` |

## Stmatic Endpoint

stMATIC token price in USD.

`stmatic` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

MIT License
