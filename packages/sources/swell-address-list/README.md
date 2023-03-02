# Swell Address List Adapter

![1.0.10](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/swell-address-list/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This EA fetches the list of custodial addresses that hold the funds for a PoR feed

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                                     Description                                      |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL | The RPC URL to connect to the EVM chain the address manager contract is deployed to. | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint) | `address` |

## Address Endpoint

This EA fetches the list of custodial addresses that hold the funds for a PoR feed

`address` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases |                                 Description                                  |  Type  |       Options       |  Default   | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :--------------------------------------------------------------------------: | :----: | :-----------------: | :--------: | :--------: | :------------: |
|           | contractAddress |         | The address of the Address Manager contract holding the custodial addresses. | string |                     |            |            |                |
|           |  confirmations  |         |                The number of confirmations to query data from                |        |                     |            |            |                |
|           |     chainId     |         |                    The name of the target custodial chain                    | string | `goerli`, `mainnet` | `mainnet`  |            |                |
|           |     network     |         |              The name of the target custodial network protocol               | string |     `ethereum`      | `ethereum` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
