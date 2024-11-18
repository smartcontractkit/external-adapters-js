# STADER_ADDRESS_LIST

![2.3.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/stader-address-list/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        RPC_URL        |   The RPC URL to connect to the EVM chain the address manager contract is deployed to.    | string |         |         |
|           |       CHAIN_ID        |                                The chain id to connect to                                 | number |         |   `1`   |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

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

| Required? |            Name            | Aliases |                                                                                  Description                                                                                  |   Type   |       Options       |  Default   | Depends On | Not Valid With |
| :-------: | :------------------------: | :-----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----------------: | :--------: | :--------: | :------------: |
|           |     poolFactoryAddress     |         |                                                                The address of the Stader PoolFactory contract.                                                                |  string  |                     |            |            |                |
|           | permissionlessNodeRegistry |         |                                                       The address of the Stader Permissionless Node Registry contract.                                                        |  string  |                     |            |            |                |
|           |    stakeManagerAddress     |         |                                                               The address of the Stader StakeManager contract.                                                                |  string  |                     |            |            |                |
|           |       penaltyAddress       |         |                                                                  The address of the Stader Penalty contract.                                                                  |  string  |                     |            |            |                |
|           |  permissionedPoolAddress   |         |                                                                 The address of the Stader Permissioned Pool.                                                                  |  string  |                     |            |            |                |
|           |    staderConfigAddress     |         |                                                                  The address of the Stader Config contract.                                                                   |  string  |                     |            |            |                |
|           |    staderOracleAddress     |         |                                                                  The address of the Stader Oracle contract.                                                                   |  string  |                     |            |            |                |
|           |       confirmations        |         |                                                                The number of confirmations to query data from                                                                 |  number  |                     |            |            |                |
|           |          chainId           |         |                                                                    The name of the target custodial chain                                                                     |  string  | `goerli`, `mainnet` | `mainnet`  |            |                |
|           |          network           |         |                                                               The name of the target custodial network protocol                                                               |  string  |     `ethereum`      | `ethereum` |            |                |
|           |      validatorStatus       |         |                                                                 A filter to apply validators by their status                                                                  | string[] |                     |            |            |                |
|           |         batchSize          |         |                                                         The number of addresses to fetch from the contract at a time                                                          |  number  |                     |    `10`    |            |                |
|           |         syncWindow         |         | The number of blocks Stader's reported block cannot be within of the current block. Used to ensure the balance and total supply feeds are reporting info from the same block. |  number  |                     |   `300`    |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "address",
    "batchSize": 10,
    "chainId": "goerli",
    "confirmations": 0,
    "network": "ethereum",
    "syncWindow": 300,
    "validatorStatus": []
  }
}
```

---

MIT License
