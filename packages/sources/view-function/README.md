# VIEW_FUNCTION

![3.1.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/view-function/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   ETHEREUM_RPC_URL    |                               RPC URL of a Mainnet ETH node                               | string |         |         |
|           |   ETHEREUM_CHAIN_ID   |                                The chain id to connect to                                 | number |         |   `1`   |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [function](#function-endpoint) | `function` |

## Function Endpoint

`function` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |  Aliases   |                                                                         Description                                                                         |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :--------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  signature  | `function` | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |  string  |         |         |            |                |
|    ✅     |   address   | `contract` |                                                                   Address of the contract                                                                   |  string  |         |         |            |                |
|           | inputParams |            |                                                            Array of function parameters in order                                                            | string[] |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
