# ETH_BEACON

![2.0.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eth-beacon/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                                                                                                    Description                                                                                                                    |  Type  | Options | Default |
| :-------: | :-------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | ETH_CONSENSUS_RPC_URL |                                                                                               RPC URL of an Ethereum consensus client (beacon node)                                                                                               | string |         |         |
|           | ETH_EXECUTION_RPC_URL |                                                                 RPC URL of an Ethereum execution client (archive node). Required for requests that need a limbo validator search                                                                  | string |         |   ``    |
|           |      BATCH_SIZE       | Number of validators to send in each request to the consensus client. Set to 0 if consensus client allows unlimited validators in query. Setting this lower than the default and greater than 0 may result in lower performance from the adapter. | number |         |  `15`   |
|           |      GROUP_SIZE       |       Number of requests to execute asynchronously before the adapter waits to execute the next group of requests. Setting this lower than the default may result in lower performance from the adapter. Unused if BATCH_SIZE is set to 0.        | number |         |  `15`   |
|           |       CHAIN_ID        |                                                                                                            The chain id to connect to                                                                                                             | number |         |   `1`   |
|           | BACKGROUND_EXECUTE_MS |                                                                             The amount of time the background execute should sleep before performing the next request                                                                             | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |         Name          | Aliases  |                                                       Description                                                        |   Type   | Options |   Default   | Depends On | Not Valid With |
| :-------: | :-------------------: | :------: | :----------------------------------------------------------------------------------------------------------------------: | :------: | :-----: | :---------: | :--------: | :------------: |
|    ✅     |       addresses       | `result` |            An array of addresses to get the balances of (as an object with string `address` as an attribute)             | object[] |         |             |            |                |
|    ✅     |   addresses.address   |          |                                             an address to get the balance of                                             |  string  |         |             |            |                |
|           |        stateId        |          |                                            The beacon chain state ID to query                                            |  string  |         | `finalized` |            |                |
|           |    validatorStatus    |          |                                       A filter to apply validators by their status                                       | string[] |         |             |            |                |
|           | searchLimboValidators |          | Flag to determine if deposit events need to be searched for limbo validators. Only set to true if using an archive node. | boolean  |         |             |            |                |

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
    "searchLimboValidators": false,
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
    "validators": [
      {
        "index": "416512",
        "balance": "32081209325",
        "status": "active_ongoing",
        "validator": {
          "pubkey": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
          "withdrawal_credentials": "0x00f50428677c60f997aadeab24aabf7fceaef491c96a52b463ae91f95611cf71",
          "effective_balance": "32000000000",
          "slashed": false,
          "activation_eligibility_epoch": "0",
          "activation_epoch": "0",
          "exit_epoch": "18446744073709551615",
          "withdrawable_epoch": "18446744073709551615"
        }
      },
      {
        "index": "416580",
        "balance": "32067790944",
        "status": "active_ongoing",
        "validator": {
          "pubkey": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
          "withdrawal_credentials": "0x00f50428677c60f997aadeab24aabf7fceaef491c96a52b463ae91f95611cf71",
          "effective_balance": "32000000000",
          "slashed": false,
          "activation_eligibility_epoch": "0",
          "activation_epoch": "0",
          "exit_epoch": "18446744073709551615",
          "withdrawable_epoch": "18446744073709551615"
        }
      }
    ],
    "result": [
      {
        "address": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
        "balance": "32081209325"
      },
      {
        "address": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
        "balance": "32067790944"
      }
    ]
  },
  "result": [
    {
      "address": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
      "balance": "32081209325"
    },
    {
      "address": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
      "balance": "32067790944"
    }
  ],
  "statusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

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
      },
      {
        "address": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"
      }
    ],
    "stateId": "finalized",
    "validatorStatus": ["active"],
    "searchLimboValidators": false,
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "tU43F50dDWV17PE1pOCRxnNRG0U="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "validators": [
      {
        "index": "416512",
        "balance": "32081209325",
        "status": "active_ongoing",
        "validator": {
          "pubkey": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
          "withdrawal_credentials": "0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77",
          "effective_balance": "32000000000",
          "slashed": false,
          "activation_eligibility_epoch": "142627",
          "activation_epoch": "142641",
          "exit_epoch": "18446744073709551615",
          "withdrawable_epoch": "18446744073709551615"
        }
      },
      {
        "index": "416580",
        "balance": "32067790944",
        "status": "active_ongoing",
        "validator": {
          "pubkey": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
          "withdrawal_credentials": "0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77",
          "effective_balance": "32000000000",
          "slashed": false,
          "activation_eligibility_epoch": "143203",
          "activation_epoch": "143209",
          "exit_epoch": "18446744073709551615",
          "withdrawable_epoch": "18446744073709551615"
        }
      }
    ],
    "result": [
      {
        "address": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
        "balance": "32081209325"
      },
      {
        "address": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
        "balance": "32067790944"
      },
      {
        "address": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
        "balance": "0"
      }
    ]
  },
  "result": [
    {
      "address": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
      "balance": "32081209325"
    },
    {
      "address": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
      "balance": "32067790944"
    },
    {
      "address": "0x000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
      "balance": "0"
    }
  ],
  "statusCode": 200
}
```

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
      },
      {
        "address": "0x98416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d5c3b75fdd1e9e10c87c6"
      }
    ],
    "stateId": "finalized",
    "searchLimboValidators": true,
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "T1oB7mWX8EhwMKgMcUSqfDnbU7E="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "validators": [
      {
        "index": "416512",
        "balance": "32081209325",
        "status": "active_ongoing",
        "validator": {
          "pubkey": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
          "withdrawal_credentials": "0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77",
          "effective_balance": "32000000000",
          "slashed": false,
          "activation_eligibility_epoch": "142627",
          "activation_epoch": "142641",
          "exit_epoch": "18446744073709551615",
          "withdrawable_epoch": "18446744073709551615"
        }
      },
      {
        "index": "416580",
        "balance": "32067790944",
        "status": "active_ongoing",
        "validator": {
          "pubkey": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
          "withdrawal_credentials": "0x010000000000000000000000e0c8df4270f4342132ec333f6048cb703e7a9c77",
          "effective_balance": "32000000000",
          "slashed": false,
          "activation_eligibility_epoch": "143203",
          "activation_epoch": "143209",
          "exit_epoch": "18446744073709551615",
          "withdrawable_epoch": "18446744073709551615"
        }
      }
    ],
    "result": [
      {
        "address": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
        "balance": "32081209325"
      },
      {
        "address": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
        "balance": "32067790944"
      },
      {
        "address": "0x98416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d5c3b75fdd1e9e10c87c6",
        "balance": "1000000000"
      }
    ]
  },
  "result": [
    {
      "address": "0x8bdb63ea991f42129d6defa8d3cc5926108232c89824ad50d57f49a0310de73e81e491eae6587bd1465fa5fd8e4dee21",
      "balance": "32081209325"
    },
    {
      "address": "0xb672b5976879c6423ad484ba4fa0e76069684eed8e2a8081f6730907f3618d43828d1b399d2fd22d7961824594f73462",
      "balance": "32067790944"
    },
    {
      "address": "0x98416f837d457d72f0dd5297898e1225a1e7731c2579f642626fbdc8ee8ce4f1e89ca538b72d5c3b75fdd1e9e10c87c6",
      "balance": "1000000000"
    }
  ],
  "statusCode": 200
}
```

</details>

---

MIT License
