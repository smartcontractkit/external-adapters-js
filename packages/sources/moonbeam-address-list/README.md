# MOONBEAM_ADDRESS_LIST

![1.1.37](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/moonbeam-address-list/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |   Name   |                                        Description                                        |  Type  | Options | Default |
| :-------: | :------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL  | The RPC URL to connect to the Moonbeam chain the address manager contract is deployed to. | string |         |         |
|           | CHAIN_ID |                                The chain id to connect to                                 | number |         | `1284`  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

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

Request:

```json
{
  "data": {
    "endpoint": "address",
    "network": "moonbeam",
    "chainId": "mainnet"
  }
}
```

---

MIT License
