# Example Source Adapter

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/pound-token/package.json)

Example Source Adapter (this title and description were pulled from source/schemas/env.json)

Base URL https://olbsandbox.bankfrick.li/webapi/v2

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |  Description   |  Type  | Options | Default |
| :-------: | :-----: | :------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | API key to use | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [accounts](#accounts-endpoint) | `accounts` |

## Accounts Endpoint

This endpoint returns the sum of all balances for accounts specified by the user.

`accounts` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |                       Description                       | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :-----------------------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ibanIDs |         | The list of account ids included in the sum of balances | array |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
