# NEXUS_KILN

![1.0.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/nexus-kiln/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |             Name             |                                        Description                                        |  Type  | Options |                                 Default                                  |
| :-------: | :--------------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------------------------------------------------: |
|    ✅     |   ETH_BALANCE_ADAPTER_URL    |                           The location of a ETH balance adapter                           | string |         |                                                                          |
|    ✅     |       ETHEREUM_RPC_URL       |                   Ethereum RPC endpoint to get the needed on-chain data                   | string |         |                                                                          |
|           |      ETHEREUM_CHAIN_ID       |                                The chain id to connect to                                 | number |         |                                   `1`                                    |
|           | KILN_VALIDATOR_ADDRESSES_URL |                       Graphql Endpoint to get list of validator id                        | string |         | `https://api.studio.thegraph.com/query/72419/enzyme-core/version/latest` |
|           |    BACKGROUND_EXECUTE_MS     | The amount of time the background execute should sleep before performing the next request | number |         |                                 `10000`                                  |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                            Options                             |          Default           |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------: | :------------------------: |
|           | endpoint | The endpoint to use | string | [calcnetsharevalueinasset](#calcnetsharevalueinasset-endpoint) | `calcnetsharevalueinasset` |

## Calcnetsharevalueinasset Endpoint

`calcnetsharevalueinasset` is the only supported name for this endpoint.

### Input Params

| Required? |        Name         | Aliases |                                             Description                                             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----------------: | :-----: | :-------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | calculatorContract  |         |                                    Passthrough to enzyme adapter                                    | string |         |         |            |                |
|    ✅     |     quoteAsset      |         |                                    Passthrough to enzyme adapter                                    | string |         |         |            |                |
|    ✅     | nexusVaultContract  |         |                                       The Nexus Vault address                                       | string |         |         |            |                |
|    ✅     | kilnStakingContract |         |                                  The Kiln Staking Contract address                                  | string |         |         |            |                |
|           |  minConfirmations   |         | Number of blocks that must have been confirmed after the point against which the balance is checked | number |         |   `6`   |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "calcnetsharevalueinasset",
    "calculatorContract": "0x7c728cd0CfA92401E01A4849a01b57EE53F5b2b9",
    "quoteAsset": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
    "nexusVaultContract": "0x27f23c710dd3d878fe9393d93465fed1302f2ebd",
    "kilnStakingContract": "0x0816df553a89c4bff7ebfd778a9706a989dd3ce3",
    "minConfirmations": 6
  }
}
```

---

MIT License
