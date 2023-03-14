# BANK_FRICK

![1.1.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bank-frick/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [accounts](#accounts-endpoint) | `accounts` |

## Accounts Endpoint

`accounts` is the only supported name for this endpoint.

### Input Params

| Required? |       Name       | Aliases |                                                    Description                                                     |  Type  |                 Options                  |   Default    | Depends On | Not Valid With |
| :-------: | :--------------: | :-----: | :----------------------------------------------------------------------------------------------------------------: | :----: | :--------------------------------------: | :----------: | :--------: | :------------: |
|    ✅     |     ibanIDs      |         |                              The list of account ids included in the sum of balances                               | array  |                                          |              |            |                |
|           | signingAlgorithm |         | What signing algorithm is used to sign and verify authorization data, one of rsa-sha256, rsa-sha384, or rsa-sha512 | string | `rsa-sha256`, `rsa-sha384`, `rsa-sha512` | `rsa-sha512` |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
