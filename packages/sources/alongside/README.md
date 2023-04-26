# ALONGSIDE

![1.3.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/alongside/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |               Default               |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           |     API_ENDPOINT      |                            The HTTP URL to retrieve data from                             | string |         | `https://api.prime.coinbase.com/v1` |
|    ✅     |      ACCESS_KEY       |                                 An API key for alongside                                  | string |         |                                     |
|    ✅     |      PASSPHRASE       |                                An passphrase for alongside                                | string |         |                                     |
|    ✅     |     PORTFOLIO_ID      |                              The portfolio id for alongside                               | string |         |                                     |
|    ✅     |      SIGNING_KEY      |                                      The signing Key                                      | string |         |                                     |
|    ✅     |        RPC_URL        |            The RPC URL to connect to the EVM chain the contract is deployed to            | string |         |                                     |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |               `10000`               |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [collateral](#collateral-endpoint) | `collateral` |

## Collateral Endpoint

`collateral` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

There are no examples for this endpoint.

---

MIT License
