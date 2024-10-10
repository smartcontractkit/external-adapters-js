# POR_ADDRESS_LIST

![5.1.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/por-address-list/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                                                       Description                                                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        RPC_URL        |                                   The RPC URL to connect to the EVM chain the address manager contract is deployed to.                                   | string |         |         |
|           |       CHAIN_ID        |                                                                The chain id to connect to                                                                | number |         |   `1`   |
|           |      GROUP_SIZE       | The number of concurrent batched contract calls to make at a time. Setting this lower than the default may result in lower performance from the adapter. | number |         |  `100`  |
|           | BACKGROUND_EXECUTE_MS |                                The amount of time the background execute should sleep before performing the next request                                 | number |         | `10000` |

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

| Required? |         Name          | Aliases |                              Description                              |  Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :-------------------: | :-----: | :-------------------------------------------------------------------: | :-----: | :-----: | :-----: | :--------: | :------------: |
|           |     confirmations     |         |            The number of confirmations to query data from             | number  |         |         |            |                |
|    ✅     |    contractAddress    |         |         The contract address holding the custodial addresses          | string  |         |         |            |                |
|           |       batchSize       |         |     The number of addresses to fetch from the contract at a time      | number  |         |  `10`   |            |                |
|    ✅     |        network        |         |           The network name to associate with the addresses            | string  |         |         |            |                |
|    ✅     |        chainId        |         |             The chain ID to associate with the addresses              | string  |         |         |            |                |
|           | searchLimboValidators |         | Flag to pass on to the balance adapter to search for limbo validators | boolean |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
