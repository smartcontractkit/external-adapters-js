# Avalanche Platform Adapter

![1.1.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/avalanche-platform/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

Chainlink External adapter for reading from the Avalanche Platform chain's API

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                                      Description                                       |  Type  | Options | Default |
| :-------: | :-------------: | :------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | P_CHAIN_RPC_URL | Full RPC URL for the avalanche platform chain (e.g. https://api.avax.network/ext/bc/P) | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

The balance endpoint will fetch the validator balance of each address in the query. Adapts the response for the Proof of Reserves adapter.

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases  |                                            Description                                            | Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :------: | :-----------------------------------------------------------------------------------------------: | :---: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | addresses | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | array |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt",
        "network": "avalanche-fuji"
      }
    ],
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "PGHFasc8hN3lzGuA6s9gTgp1Pbc="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": [
      {
        "addresses": ["P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt"],
        "balance": "2000000000000"
      }
    ]
  },
  "result": [
    {
      "addresses": ["P-fuji1vd9sddlllrlk9fvj9lhntpw8t00lmvtnqkl2jt"],
      "balance": "2000000000000"
    }
  ],
  "statusCode": 200
}
```

---

MIT License
