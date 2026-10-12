# ANCHORAGE

![4.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/anchorage/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |                Name                |                                                             Description                                                              |  Type  | Options |           Default           |
| :-------: | :--------------------------------: | :----------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------: |
|    ✅     |           `API_ENDPOINT`           |                                                    An API endpoint for Anchorage                                                     | string |         |                             |
|    ✅     |         `${COIN}_API_KEY`          |               The API key to use for ${COIN} where ${COIN} is the upper-snake-case version of the coin input parameter               | string |         |                             |
|    ✅     | `COLLATERAL_API_KEY_${PACKAGE_ID}` | API key for Anchorage collateral_management endpoints where ${PACKAGE_ID} is the upper-case version of the packageId input parameter | string |         |                             |
|           |     `COLLATERAL_API_ENDPOINT`      |                                    An API endpoint for Anchorage collateral_management endpoints                                     | string |         | `https://api.anchorage.com` |
|           |            `API_LIMIT`             |                                        The maximum number of results to request from the API                                         | number |         |            `50`             |
|           |      `BACKGROUND_EXECUTE_MS`       |                      The amount of time the background execute should sleep before performing the next request                       | number |         |           `10000`           |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                          Note                                          |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------------------------------------: |
| default |                             |             30              |                           | Docs: 10 requests per second per Organization, bursts of up to 100 requests per second |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                          Options                           | Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [packages](#packages-endpoint), [wallet](#wallet-endpoint) | `wallet` |

## Wallet Endpoint

`wallet` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |  Aliases  |          Description          |  Type  |       Options        |  Default  | Depends On | Not Valid With |
| :-------: | :-----: | :-------: | :---------------------------: | :----: | :------------------: | :-------: | :--------: | :------------: |
|    ✅     | vaultId | `vaultID` |        Id of the vault        | string |                      |           |            |                |
|    ✅     |  coin   |           |       Asset ticker name       | string |                      |           |            |                |
|           | chainId |           | The ID of the chain to return | string | `mainnet`, `testnet` | `mainnet` |            |                |
|           | network |           |     The network to return     | string |                      | `bitcoin` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "wallet",
    "vaultId": "22ds243sa24f652dsa3",
    "coin": "BTC",
    "chainId": "mainnet",
    "network": "bitcoin"
  }
}
```

---

## Packages Endpoint

`packages` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |               Description               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :-------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | packageId |         | Id of the collateral management package | string |         |         |            |                |
|    ✅     | assetType |         |            Asset ticker name            | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "packages",
    "packageId": "1c1dd6b2899660900088",
    "assetType": "BTC"
  }
}
```

---

MIT License
