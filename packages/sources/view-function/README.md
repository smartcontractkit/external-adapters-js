# Chainlink External Adapter for View-Function

![2.0.11](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/view-function/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

External adapter for executing contract function and returning the result

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |               Description                |  Type  | Options | Default |
| :-------: | :---------------: | :--------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL  |      RPC URL of a Mainnet ETH node       | string |         |         |
|           |      RPC_URL      | A fallback RPC URL of a Mainnet ETH node | string |         |         |
|           | ETHEREUM_CHAIN_ID |        The chain id to connect to        | string |         |   `1`   |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |             Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [function](#endpoints-endpoint) | `function` |

## Endpoints Endpoint

`function` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |  Aliases   |                                                                         Description                                                                         |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :--------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  signature  | `function` | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |        |         |         |            |                |
|    ✅     |   address   | `contract` |                                                                   Address of the contract                                                                   | string |         |         |            |                |
|           | inputParams |            |                                                            Array of function parameters in order                                                            | array  |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
