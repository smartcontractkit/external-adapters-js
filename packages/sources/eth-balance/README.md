# Chainlink External Adapter for Eth-balance

![2.1.9](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eth-balance/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

External adapter for fetching balances for ETH addresses

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

## Environment Variables

| Required? |       Name        |         Description         |  Type  | Options | Default |
| :-------: | :---------------: | :-------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL  | RPC URL of an Ethereum node | string |         |         |
|           | ETHEREUM_CHAIN_ID | The chain id to connect to  | string |         |   `1`   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

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
|    ✅     |    addresses     |    `result`     |            An array of addresses to get the balances of (as an object with string `address` as an attribute). Optionally includes a `chainId` attribute to select RPC provider by chain ID.            | array  |         |         |            |                |
|           | minConfirmations | `confirmations` | Number (integer, min 0, max 64) of blocks that must have been confirmed after the point against which the balance is checked (i.e. balance will be sourced from {latestBlockNumber - minConfirmations} | number |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
