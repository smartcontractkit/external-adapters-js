# ENS Adapter

![2.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ens/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

ENS Adapter

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |   Name   |        Description         |  Type  | Options | Default |
| :-------: | :------: | :------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL  |  A valid Ethereum RPC URL  | string |         |         |
|           | CHAIN_ID | The chain id to connect to | string |         |   `1`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [lookup](#lookup-endpoint) | `lookup` |

## Lookup Endpoint

Look up information about a human friendly ENS domain name

`lookup` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |       Description       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :---------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ensName |         | The ENS name to look up | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
