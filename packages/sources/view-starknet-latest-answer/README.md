# VIEW_STARKNET_LATEST_ANSWER

![1.0.12](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/view-starknet-latest-answer/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   STARKNET_RPC_URL    |                           The Starknet RPC URL to use for calls                           | string |         |         |
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

| Required? |  Name   |  Aliases   |       Description       |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :--------: | :---------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | address | `contract` | Address of the contract | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
