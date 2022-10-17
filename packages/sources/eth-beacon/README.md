# Chainlink External Adapter for Ethereum Beacon API

![1.1.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eth-beacon/package.json)

External adapter for reading from the Ethereum PoS Beacon chain's API

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |            Description             |  Type  | Options | Default |
| :-------: | :--------------: | :--------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETHEREUM_RPC_URL | RPC URL of an Ethereum beacon node | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

**NOTE:** The balance output is given in Gwei!

**NOTE**: The balance query is normally quite slow, no matter how many validators are being queried. API_TIMEOUT has been set to default to 60s.

The balance endpoint will fetch the validator balance of each address in the query. Adapts the response for the Proof Of Reserves adapter.

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases  |                                            Description                                            |  Type  | Options |   Default   | Depends On | Not Valid With |
| :-------: | :-------------: | :------: | :-----------------------------------------------------------------------------------------------: | :----: | :-----: | :---------: | :--------: | :------------: |
|    ✅     |    addresses    | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | array  |         |             |            |                |
|           |     stateId     |          |                                The beacon chain state ID to query                                 | string |         | `finalized` |            |                |
|           | validatorStatus |          |                           A filter to apply validators by their status                            | array  |         |             |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21"
      },
      {
        "address": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462"
      }
    ],
    "stateId": "finalized",
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "REKJYLubw5SV3C3X+gjfvyXm/AU="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "balances": [
      {
        "address": "416512",
        "balance": "32081209325"
      },
      {
        "address": "416580",
        "balance": "32067790944"
      }
    ],
    "result": [
      {
        "address": "416512",
        "balance": "32081209325"
      },
      {
        "address": "416580",
        "balance": "32067790944"
      }
    ]
  },
  "result": [
    {
      "address": "416512",
      "balance": "32081209325"
    },
    {
      "address": "416580",
      "balance": "32067790944"
    }
  ],
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
