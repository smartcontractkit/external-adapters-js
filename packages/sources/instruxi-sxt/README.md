# INSTRUXI_SXT

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/instruxi-sxt/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name      |              Description               |  Type  | Options |               Default                |
| :-------: | :------------: | :------------------------------------: | :----: | :-----: | :----------------------------------: |
|    ✅     |  API_ENDPOINT  | An API endpoint for Data Provider (SxT | string |         | `https://proxy.api.spaceandtime.app` |
|    ✅     |    API_KEY     |   An API key for Data Provider (SxT)   | string |         |                                      |
|    ✅     | SXT_TABLE_NAME | Space and Time Attestations table name | string |         |                                      |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| default |                             |              5              |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                 Options                  |     Default     |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------: | :-------------: |
|           | endpoint | The endpoint to use | string | [total_reserve](#total_reserve-endpoint) | `total_reserve` |

## Total_reserve Endpoint

`total_reserve` is the only supported name for this endpoint.

### Input Params

| Required? |          Name          | Aliases |                  Description                  |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------------------: | :-----: | :-------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  biscuit_attestation   |         |     Access biscuit for attestations table     | string |         |         |            |                |
|    ✅     |  biscuit_blockchains   |         |     Access biscuit for blockchains table      | string |         |         |            |                |
|    ✅     |        chain_id        |         |              Specify a chain ID               | string |         |         |            |                |
|    ✅     | asset_contract_address |         | NFT contract address associated with the coin | string |         |         |            |                |
|    ✅     | token_contract_address |         | NFT contract address associated with the coin | string |         |         |            |                |
|    ✅     |       namespace        |         |                 SxT namespace                 | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "total_reserve",
    "biscuit_attestation": "example_biscuit_attestations",
    "biscuit_blockchains": "example_biscuit_blockchains",
    "chain_id": "example_chainId",
    "asset_contract_address": "example contract address",
    "token_contract_address": "example token contract address",
    "namespace": "SxT namespace"
  }
}
```

---

MIT License
