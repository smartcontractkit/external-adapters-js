# Chainlink Composite External Adapter for Example Data Provider

![1.3.14](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/examples/composite/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       | Description |  Type   | Options | Default |
| :-------: | :--------------: | :---------: | :-----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL |             | string  |         |         |
|           |      OPTION      |             | boolean |         | `true`  |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [example](#example-endpoint) | `example` |

## Example Endpoint

`example` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |    Aliases     |        Description        | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :-----------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   Base asset to convert   |      |         |         |            |                |
|    ✅     | quote | `market`, `to` | Quote asset to convert to |      |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
