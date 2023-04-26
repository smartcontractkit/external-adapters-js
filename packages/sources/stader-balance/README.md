# STADER_BALANCE

![1.0.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/stader-balance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                           Description                                           |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   ETHEREUM_RPC_URL    |                            The RPC URL to connect to the EVM chain.                             | string |         |         |
|    ✅     |    BEACON_RPC_URL     |                             The RPC URL of an Ethereum beacon node                              | string |         |         |
|           |       CHAIN_ID        |                                   The chain id to connect to                                    | number |         |   `1`   |
|           |      BATCH_SIZE       |    The size of batches the addresses are split into for each request to the consensus client    | number |         |  `15`   |
|           |      GROUP_SIZE       | Number of requests to execute asynchronously before the adapter waits to execute the next batch | number |         |  `25`   |
|           | BACKGROUND_EXECUTE_MS |    The amount of time the background execute should sleep before performing the next request    | number |         | `10000` |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |          Name           | Aliases  |                                            Description                                            |  Type  |       Options       |   Default   | Depends On | Not Valid With |
| :-------: | :---------------------: | :------: | :-----------------------------------------------------------------------------------------------: | :----: | :-----------------: | :---------: | :--------: | :------------: |
|    ✅     |        addresses        | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | array  |                     |             |            |                |
|    ✅     |    elRewardAddresses    |          |                          List of unique execution layer reward addresses                          | array  |                     |             |            |                |
|    ✅     |   socialPoolAddresses   |          |                                List of socializing pool addresses                                 | array  |                     |             |            |                |
|           |         stateId         |          |                                The beacon chain state ID to query                                 | string |                     | `finalized` |            |                |
|           |     validatorStatus     |          |                           A filter to apply validators by their status                            | array  |                     |             |            |                |
|           |     penaltyAddress      |          |                            The address of the Stader Penalty contract.                            | string |                     |             |            |                |
|           |   poolFactoryAddress    |          |                          The address of the Stader PoolFactory contract.                          | string |                     |             |            |                |
|           |   stakeManagerAddress   |          |                         The adddress of the Stader StakeManager contract                          | string |                     |             |            |                |
|           | permissionedPoolAddress |          |                           The adddress of the Stader Permissioned Pool                            | string |                     |             |            |                |
|           |   staderConfigAddress   |          |                            The address of the Stader Config contract.                             | string |                     |             |            |                |
|           |         network         |          |                         The name of the target custodial network protocol                         | string |     `ethereum`      | `ethereum`  |            |                |
|           |         chainId         |          |                              The name of the target custodial chain                               | string | `goerli`, `mainnet` |  `mainnet`  |            |                |
|           |      confirmations      |          |                          The number of confirmations to query data from                           | number |                     |             |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
