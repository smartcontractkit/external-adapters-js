# Chainlink External Adapter for Eth-balance

![2.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eth-balance/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

External adapter for fetching balances for ETH addresses

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |         Description         |  Type  | Options | Default |
| :-------: | :---------------: | :-------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL  | RPC URL of an Ethereum node | string |         |         |
|           | ETHEREUM_CHAIN_ID | The chain id to connect to  | string |         |   `1`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

The balance endpoint will fetch the balance of each address in the query.

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |       Name       |     Aliases     |                                                                                              Description                                                                                               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------------: | :-------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    addresses     |    `result`     |                                                   An array of addresses to get the balances of (as an object with string `address` as an attribute)                                                    | array  |         |         |            |                |
|           | minConfirmations | `confirmations` | Number (integer, min 0, max 64) of blocks that must have been confirmed after the point against which the balance is checked (i.e. balance will be sourced from {latestBlockNumber - minConfirmations} | number |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
