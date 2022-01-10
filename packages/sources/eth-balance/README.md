# Chainlink External Adapter for Eth-balance

Version: 1.1.1

External adapter for fetching balances for ETH addresses

## Environment Variables

| Required? |       Name       |             Description             |  Type  | Options | Default |
| :-------: | :--------------: | :---------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL | RPC URL of an Ethereum Mainnet node | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases  |                                            Description                                            | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------: | :-----------------------------------------------------------------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | addresses | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | array |         |         |            |                |

There are no examples for this endpoint.
