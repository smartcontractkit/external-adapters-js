# VIEW_FUNCTION_MULTI_CHAIN

![1.6.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/view-function-multi-chain/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Generic Environment Variables

In order to connect to different blockchains, you may need to set additional environment variables for the respective RPC URLs.

| Required? |        Name         |       Description       |  Type  | Options | Default |
| :-------: | :-----------------: | :---------------------: | :----: | :-----: | :-----: |
|           | {NETWORK}\_RPC_URL  | RPC url for a NETWORK.  | string |         |         |
|           | {NETWORK}\_CHAIN_ID | Chain id for a NETWORK. | number |         |         |

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           |       APTOS_URL       |                                    Aptos rest api url                                     | string |         |   ``    |
|           |   APTOS_TESTNET_URL   |                                Aptos testnet rest api url                                 | string |         |   ``    |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |       Note        |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------: |
| default |              1              |                             |                           | Reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                  Options                                                                                   |  Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [aptos-df-reader](#aptos-df-reader-endpoint), [aptos](#aptos-endpoint), [function-response-selector](#function-response-selector-endpoint), [function](#function-endpoint) | `function` |

## Function Endpoint

`function` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |  Aliases   |                                                                         Description                                                                         |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :--------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  signature  | `function` | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |  string  |         |         |            |                |
|    ✅     |   address   | `contract` |                                                                   Address of the contract                                                                   |  string  |         |         |            |                |
|           | inputParams |            |                                                            Array of function parameters in order                                                            | string[] |         |         |            |                |
|    ✅     |   network   |            |                                                                      RPC network name                                                                       |  string  |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Function-response-selector Endpoint

`function-response-selector` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |  Aliases   |                                                                         Description                                                                         |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :--------: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |  signature  | `function` | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |  string  |         |         |            |                |
|    ✅     |   address   | `contract` |                                                                   Address of the contract                                                                   |  string  |         |         |            |                |
|           | inputParams |            |                                                            Array of function parameters in order                                                            | string[] |         |         |            |                |
|    ✅     |   network   |            |                                                                      RPC network name                                                                       |  string  |         |         |            |                |
|    ✅     | resultField |            |                      If present, returns the named parameter specified from the signature's response. Has precedence over resultIndex.                      |  string  |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Aptos Endpoint

`aptos` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |  Aliases   |                              Description                              |   Type   |       Options        |  Default  | Depends On | Not Valid With |
| :-------: | :---------: | :--------: | :-------------------------------------------------------------------: | :------: | :------------------: | :-------: | :--------: | :------------: |
|    ✅     |  signature  | `function` | Function signature. Format: {address}::{module name}::{function name} |  string  |                      |           |            |                |
|           |  arguments  |            |                       Arguments of the function                       | string[] |                      |           |            |                |
|           |    type     |            |                    Type arguments of the function                     | string[] |                      |           |            |                |
|           |    index    |            |           Which item in the function output array to return           |  number  |                      |           |            |                |
|           | networkType |            |                          testnet or mainnet                           |  string  | `mainnet`, `testnet` | `mainnet` |            |                |

### Example

There are no examples for this endpoint.

---

## Aptos-df-reader Endpoint

`aptos-df-reader` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     |  Aliases   |                              Description                              |   Type   |       Options        |  Default  | Depends On | Not Valid With |
| :-------: | :---------: | :--------: | :-------------------------------------------------------------------: | :------: | :------------------: | :-------: | :--------: | :------------: |
|    ✅     |  signature  | `function` | Function signature. Format: {address}::{module name}::{function name} |  string  |                      |           |            |                |
|           |  arguments  |            |                       Arguments of the function                       | string[] |                      |           |            |                |
|           |    type     |            |                    Type arguments of the function                     | string[] |                      |           |            |                |
|           |    index    |            |           Which item in the function output array to return           |  number  |                      |           |            |                |
|           | networkType |            |                          testnet or mainnet                           |  string  | `mainnet`, `testnet` | `mainnet` |            |                |
|    ✅     |   feedId    |            |                            feedId to parse                            |  string  |                      |           |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
