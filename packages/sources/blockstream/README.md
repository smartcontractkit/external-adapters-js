# Chainlink External Adapter for Blockstream

![1.4.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/blockstream/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |            Default             |
| :-------: | :----------: | :---------: | :----: | :-----: | :----------------------------: |
|           | API_ENDPOINT |             | string |         | `https://blockstream.info/api` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                          Options                           |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [difficulty](#blocks-endpoint), [height](#blocks-endpoint) | `difficulty` |

## Blocks Endpoint

Supported names for this endpoint are: `difficulty`, `height`.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

MIT License
