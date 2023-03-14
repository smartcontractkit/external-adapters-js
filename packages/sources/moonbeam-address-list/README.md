# MOONBEAM_ADDRESS_LIST

![1.1.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/moonbeam-address-list/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint) | `address` |

## Address Endpoint

`address` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases |                                 Description                                  |  Type  |       Options        |  Default   | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :--------------------------------------------------------------------------: | :----: | :------------------: | :--------: | :--------: | :------------: |
|           | contractAddress |         | The address of the Address Manager contract holding the custodial addresses. | string |                      |            |            |                |
|           |     chainId     |         |                    The name of the target custodial chain                    | string | `mainnet`, `testnet` | `mainnet`  |            |                |
|           |     network     |         |              The name of the target custodial network protocol               | string |      `moonbeam`      | `moonbeam` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
