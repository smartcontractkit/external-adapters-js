# Chainlink External Adapter for Solana-view-function

![2.2.27](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/solana-view-function/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

The Solana view function adapter can be used to query account information from the Solana blockchain

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |    Name    |                                                                                                                                Description                                                                                                                                |  Type  |                                         Options                                          |   Default   |
| :-------: | :--------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :--------------------------------------------------------------------------------------: | :---------: |
|           | COMMITMENT |                                                                                                                                                                                                                                                                           | string | `confirmed`, `finalized`, `max`, `processed`, `recent`, `root`, `single`, `singleGossip` | `confirmed` |
|    ✅     |  RPC_URL   | The RPC URL to a Solana node. Options include `https://api.devnet.solana.com`, `https://api.testnet.solana.com`, `https://api.mainnet-beta.solana.com`, `https://solana-api.projectserum.com`. Full list can be found here https://docs.solana.com/cluster/rpc-endpoints. | string |                                                                                          |             |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [accounts](#accounts-endpoint) | `accounts` |

## Accounts Endpoint

`accounts` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                     Description                     | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :-------------------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | addresses |         | An array of the addresses to query information from | array |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
