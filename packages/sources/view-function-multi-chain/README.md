# VIEW_FUNCTION_MULTI_CHAIN

![1.6.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/view-function-multi-chain/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Generic Environment Variables

In order to connect to different blockchains, you may need to set additional environment variables for the respective RPC URLs.

| Required? |        Name         |       Description       |  Type  | Options | Default |
| :-------: | :-----------------: | :---------------------: | :----: | :-----: | :-----: |
|           | {NETWORK}\_RPC_URL  | RPC url for a NETWORK.  | string |         |         |
|           | {NETWORK}\_CHAIN_ID | Chain id for a NETWORK. | number |         |         |

## Environment Variables

| Required? |         Name          |                                                 Description                                                  |  Type  | Options | Default |
| :-------: | :-------------------: | :----------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|           |       APTOS_URL       |                                              Aptos rest api url                                              | string |         |   ``    |
|           |   APTOS_TESTNET_URL   |                                          Aptos testnet rest api url                                          | string |         |   ``    |
|           |      GROUP_SIZE       | Number of requests to execute asynchronously before the adapter waits to execute the next group of requests. | number |         |  `10`   |
|           | BACKGROUND_EXECUTE_MS |          The amount of time the background execute should sleep before performing the next request           | number |         | `10000` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |       Note        |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------: |
| default |              1              |                             |                           | Reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                                   Options                                                                                                                    |  Default   |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [aptos-df-reader](#aptos-df-reader-endpoint), [aptos](#aptos-endpoint), [calculated-multi-function](#calculated-multi-function-endpoint), [function-response-selector](#function-response-selector-endpoint), [function](#function-endpoint) | `function` |

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

Request:

```json
{
  "data": {
    "endpoint": "function",
    "signature": "function convertToAssets(uint256 shares) external view returns (uint256 assets)",
    "address": "0xc8CF6D7991f15525488b2A83Df53468D682Ba4B0",
    "inputParams": ["1000000000000000000"],
    "network": "ethereum"
  }
}
```

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

## Calculated-multi-function Endpoint

`calculated-multi-function` is the only supported name for this endpoint.

### Input Params

| Required? |           Name            | Aliases |                                                                         Description                                                                         |   Type   |                           Options                            | Default | Depends On | Not Valid With |
| :-------: | :-----------------------: | :-----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :----------------------------------------------------------: | :-----: | :--------: | :------------: |
|           |       functionCalls       |         |                                                   Array view-function calls to be made to the blockchain                                                    | object[] |                                                              |         |            |                |
|    ✅     |    functionCalls.name     |         |                                                              Name of the function call result                                                               |  string  |                                                              |         |            |                |
|    ✅     |  functionCalls.signature  |         | Function signature. Should be formatted as [human readable ABI](https://docs.ethers.io/v5/single-page/#/v5/getting-started/-%23-getting-started--contracts) |  string  |                                                              |         |            |                |
|    ✅     |   functionCalls.address   |         |                                                                   Address of the contract                                                                   |  string  |                                                              |         |            |                |
|           | functionCalls.inputParams |         |                                                            Array of function parameters in order                                                            | string[] |                                                              |         |            |                |
|    ✅     |   functionCalls.network   |         |                                                                      RPC network name                                                                       |  string  |                                                              |         |            |                |
|           |         constants         |         |                                                        Constant value to be included in the response                                                        | object[] |                                                              |         |            |                |
|    ✅     |      constants.name       |         |                                                                 Name of the constant result                                                                 |  string  |                                                              |         |            |                |
|    ✅     |      constants.value      |         |                                                                    Value of the constant                                                                    |  string  |                                                              |         |            |                |
|           |        operations         |         |                                               Results derived from other results by applying basic operations                                               | object[] |                                                              |         |            |                |
|    ✅     |      operations.name      |         |                                                                 Name of the derived result                                                                  |  string  |                                                              |         |            |                |
|    ✅     |      operations.type      |         |                                                        The operation or source of the derived result                                                        |  string  | `add`, `average`, `divide`, `multiply`, `select`, `subtract` |         |            |                |
|    ✅     |      operations.args      |         |                 Inputs to the expression. Can be names of functionCalls or constants or specific values depending on the type of operation                  | string[] |                                                              |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "calculated-multi-function",
    "functionCalls": [
      {
        "name": "result",
        "signature": "function convertToAssets(uint256 shares) external view returns (uint256 assets)",
        "address": "0xc8CF6D7991f15525488b2A83Df53468D682Ba4B0",
        "inputParams": ["1000000000000000000"],
        "network": "ethereum"
      },
      {
        "name": "decimals",
        "signature": "function decimals() view returns (uint8)",
        "address": "0xc8CF6D7991f15525488b2A83Df53468D682Ba4B0",
        "inputParams": [],
        "network": "ethereum"
      }
    ],
    "constants": [
      {
        "name": "constant_example",
        "value": "42"
      }
    ],
    "operations": [
      {
        "name": "scaled_result",
        "type": "multiply",
        "args": ["result", "constant_example"]
      }
    ]
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "calculated-multi-function",
    "functionCalls": [
      {
        "name": "priceLowHigh",
        "address": "0x56f40A33e3a3fE2F1614bf82CBeb35987ac10194",
        "network": "ethereum",
        "signature": "function price() external view returns (uint192 low, uint192 high)",
        "inputParams": []
      }
    ],
    "constants": [],
    "operations": [
      {
        "name": "priceLow",
        "type": "select",
        "args": ["priceLowHigh", "low"]
      }
    ]
  }
}
```

</details>

---

MIT License
