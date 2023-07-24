# POLKADOT_BALANCE

![1.2.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/polkadot-balance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |    Name    |                                           Description                                           |  Type  | Options | Default |
| :-------: | :--------: | :---------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |  RPC_URL   |            The websocket URL used to retrieve balances from the Polkadot Relay Chain            | string |         |         |
|           | BATCH_SIZE | Number of requests to execute asynchronously before the adapter waits to execute the next batch | number |         |  `25`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |       Name        | Aliases  |                                            Description                                            |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------------: | :------: | :-----------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |     addresses     | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | object[] |         |         |            |                |
|    ✅     | addresses.address |          |                                 an address to get the balance of                                  |  string  |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
