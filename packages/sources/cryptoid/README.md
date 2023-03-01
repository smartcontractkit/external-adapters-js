# Chainlink External Adapter for cryptoID

![1.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptoid/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                           Options                            |   Default    |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [difficulty](#bc_info-endpoint), [height](#bc_info-endpoint) | `difficulty` |

## Bc_info Endpoint

Supported names for this endpoint are: `difficulty`, `height`.

### Input Params

| Required? |    Name    | Aliases |     Description      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | blockchain | `coin`  | The blockchain name. | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
