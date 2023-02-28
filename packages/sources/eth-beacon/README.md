# Chainlink External Adapter for Ethereum Beacon API

![1.3.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eth-beacon/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

External adapter for reading from the Ethereum PoS Beacon chain's API

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |                                        Description                                        |  Type  | Options | Default |
| :-------: | :--------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL |                            RPC URL of an Ethereum beacon node                             | string |         |         |
|           |    BATCH_SIZE    | The size of batches the addresses are split into for each request to the consensus client | string |         |  `15`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

**NOTE:** The balance output is given in Gwei!

**NOTE**: The balance query is normally quite slow, no matter how many validators are being queried. API_TIMEOUT has been set to default to 60s.

The balance endpoint will fetch the validator balance of each address in the query. Adapts the response for the Proof Of Reserves adapter.

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases  |                                            Description                                            |  Type  | Options |   Default   | Depends On | Not Valid With |
| :-------: | :-------------: | :------: | :-----------------------------------------------------------------------------------------------: | :----: | :-----: | :---------: | :--------: | :------------: |
|    ✅     |    addresses    | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | array  |         |             |            |                |
|           |     stateId     |          |                                The beacon chain state ID to query                                 | string |         | `finalized` |            |                |
|           | validatorStatus |          |                           A filter to apply validators by their status                            | array  |         |             |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
