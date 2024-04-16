# DLC_BTC_VAULT_DATA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/dlc-btc-vault-data/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |                   Default                    |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |        RPC_URL        |                          The RPC URL to connect to the EVM chain                          | string |         |                                              |
|    ✅     |       CHAIN_ID        |                                The chain id to connect to                                 | number |         |                   `42161`                    |
|    ✅     |     DLC_CONTRACT      |                        Contract address to fetch all funded vaults                        | string |         | `0x20157DBAbb84e3BBFE68C349d0d44E48AE7B5AD2` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |                   `10000`                    |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [vaults](#vaults-endpoint) | `vaults` |

## Vaults Endpoint

`vaults` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "vaults"
  }
}
```

---

MIT License
