# ANCHORAGE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/anchorage/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        API_KEY        |                                 An API key for Anchorage                                  | string |         |         |
|    ✅     |     API_ENDPOINT      |                               An API endpoint for Anchorage                               | string |         |         |
|           |       API_LIMIT       |                   The maximum number of results to request from the API                   | number |         |  `50`   |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `40000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [wallet](#wallet-endpoint) | `wallet` |

## Wallet Endpoint

`wallet` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |  Aliases  |          Description          |  Type  |       Options        |  Default  | Depends On | Not Valid With |
| :-------: | :-----: | :-------: | :---------------------------: | :----: | :------------------: | :-------: | :--------: | :------------: |
|    ✅     | vaultId | `vaultID` |          customerId           | string |                      |           |            |                |
|           | chainId |           | The ID of the chain to return | string | `mainnet`, `testnet` | `mainnet` |            |                |
|           | network |           |     The network to return     | string |                      | `bitcoin` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "wallet",
    "vaultId": "22ds243sa24f652dsa3",
    "chainId": "mainnet",
    "network": "bitcoin"
  }
}
```

---

MIT License
