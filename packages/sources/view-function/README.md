# Chainlink External Adapter for View-Function

![1.1.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/view-function/package.json)

External adapter for executing contract function and returning the result

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |               Description                |  Type  | Options | Default |
| :-------: | :--------------: | :--------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL |      RPC URL of a Mainnet ETH node       | string |         |         |
|           |     RPC_URL      | A fallback RPC URL of a Mainnet ETH node | string |         |         |

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

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "function",
    "signature": "function symbol() view returns (string)",
    "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7"
  },
  "debug": {
    "cacheKey": "i+gWrJZw68WU1SlaR+u5dJb+fbA="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000045553445400000000000000000000000000000000000000000000000000000000"
  },
  "result": "0x000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000000045553445400000000000000000000000000000000000000000000000000000000",
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
