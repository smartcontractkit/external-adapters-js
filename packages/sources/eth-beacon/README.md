# ETH_BEACON

![3.0.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/eth-beacon/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### ETH Beacon API version

Starting from version 3.0.0, the eth-beacon EA is compatible with the ETH Beacon API(`ETH_CONSENSUS_RPC_URL`) version 2.5.0 or later. If you are using an older version of the ETH Beacon API, you will need to upgrade it to 2.5.0 or later to use the eth-beacon EA.

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

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
  "data": {
    "endpoint": "balance",
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
    "validatorStatus": []
  }
}
```

---

MIT License
