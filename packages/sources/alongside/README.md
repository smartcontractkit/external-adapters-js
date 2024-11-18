# ALONGSIDE

![1.3.33](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/alongside/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

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

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [collateral](#collateral-endpoint) | `collateral` |

## Collateral Endpoint

`collateral` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "collateral"
  }
}
```

---

MIT License
