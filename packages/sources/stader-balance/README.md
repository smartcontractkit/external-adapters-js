# STADER_BALANCE

![1.4.24](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/stader-balance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

## Environment Variables

| Required? |         Name          |                                                                          Description                                                                          |  Type  | Options | Default |
| :-------: | :-------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   ETHEREUM_RPC_URL    |                                                           The RPC URL to connect to the EVM chain.                                                            | string |         |         |
|    ✅     |    BEACON_RPC_URL     |                                                            The RPC URL of an Ethereum beacon node                                                             | string |         |         |
|           |       CHAIN_ID        |                                                                  The chain id to connect to                                                                   | number |         |   `1`   |
|           |      BATCH_SIZE       | The size of batches the addresses are split into for each request to the consensus client. Set to 0 if consensus client allows unlimited validators in query. | number |         |  `15`   |
|           |      GROUP_SIZE       |                                Number of requests to execute asynchronously before the adapter waits to execute the next batch                                | number |         |  `25`   |
|           | BACKGROUND_EXECUTE_MS |                                   The amount of time the background execute should sleep before performing the next request                                   | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                              Options                               |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [totalsupply](#totalsupply-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |              Name              | Aliases  |                                            Description                                            |   Type   |                     Options                      |   Default   | Depends On | Not Valid With |
| :-------: | :----------------------------: | :------: | :-----------------------------------------------------------------------------------------------: | :------: | :----------------------------------------------: | :---------: | :--------: | :------------: |
|    ✅     |           addresses            | `result` | An array of addresses to get the balances of (as an object with string `address` as an attribute) | object[] |                                                  |             |            |                |
|    ✅     |       addresses.address        |          |                                 an address to get the balance of                                  |  string  |                                                  |             |            |                |
|    ✅     |        addresses.poolId        |          |                                   The ID of the validator pool                                    |  number  |                                                  |             |            |                |
|    ✅     |        addresses.status        |          |                          Stader status ID for this particular validator                           |  number  | `0`, `1`, `2`, `3`, `4`, `5`, `6`, `7`, `8`, `9` |             |            |                |
|    ✅     | addresses.withdrawVaultAddress |          |                    Validator withdrawal address for this particular validator                     |  string  |                                                  |             |            |                |
|    ✅     |      addresses.operatorId      |          |                   The Stader assigned operator ID for this particular validator                   |  number  |                                                  |             |            |                |
|    ✅     |       elRewardAddresses        |          |                          List of unique execution layer reward addresses                          | object[] |                                                  |             |            |                |
|    ✅     |   elRewardAddresses.address    |          |                            One of the execution layer reward addresses                            |  string  |                                                  |             |            |                |
|    ✅     |      socialPoolAddresses       |          |                                List of socializing pool addresses                                 | object[] |                                                  |             |            |                |
|    ✅     |  socialPoolAddresses.address   |          |                                 One of the social pool addresses                                  |  string  |                                                  |             |            |                |
|    ✅     |   socialPoolAddresses.poolId   |          |                                     The ID of the social pool                                     |  number  |                                                  |             |            |                |
|    ✅     |         reportedBlock          |          |                          The reported block number retrieved from Stader                          |  number  |                                                  |             |            |                |
|           |            stateId             |          |                                The beacon chain state ID to query                                 |  string  |                                                  | `finalized` |            |                |
|           |        validatorStatus         |          |                           A filter to apply validators by their status                            | string[] |                                                  |             |            |                |
|           |         penaltyAddress         |          |                            The address of the Stader Penalty contract.                            |  string  |                                                  |             |            |                |
|           |       poolFactoryAddress       |          |                          The address of the Stader PoolFactory contract.                          |  string  |                                                  |             |            |                |
|           |      stakeManagerAddress       |          |                         The adddress of the Stader StakeManager contract                          |  string  |                                                  |             |            |                |
|           |    permissionedPoolAddress     |          |                           The adddress of the Stader Permissioned Pool                            |  string  |                                                  |             |            |                |
|           |      staderConfigAddress       |          |                            The address of the Stader Config contract.                             |  string  |                                                  |             |            |                |
|           |            network             |          |                         The name of the target custodial network protocol                         |  string  |                    `ethereum`                    | `ethereum`  |            |                |
|           |            chainId             |          |                              The name of the target custodial chain                               |  string  |               `goerli`, `mainnet`                |  `mainnet`  |            |                |
|           |         confirmations          |          |                          The number of confirmations to query data from                           |  number  |                                                  |             |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "0x8cd2726ccd034cf023840c2f76f7bfd4f2e8dbe79ff0e43d2908d1124450ed1c954966a42113787bc930c0e2d73524c0",
        "withdrawVaultAddress": "0x8c78BdB9CBB273ea295Cd8eEF198467d16c932cc",
        "poolId": 1,
        "operatorId": 1,
        "status": 6
      },
      {
        "address": "0xac41f16bdd583309e5095d475ad1250dabf274045d852bd091e07f03b6de3fc4ad34705c0f1079d516df0b2d8fed0e10",
        "withdrawVaultAddress": "0x9ab0017DC97FD6A8f907f5a60FC35DB36B581783",
        "poolId": 2,
        "operatorId": 1,
        "status": 6
      }
    ],
    "chainId": "goerli",
    "confirmations": 0,
    "elRewardAddresses": [
      {
        "address": "0x8d86bc475bedcb08179c5e6a4d494ebd3b44ea8b"
      },
      {
        "address": "0xfc07bcb5c142c7c86c84490f068d31499610ccab"
      }
    ],
    "network": "ethereum",
    "reportedBlock": 8000,
    "socialPoolAddresses": [
      {
        "address": "0x10f4F0a7aadfB7E79533090508fADD78FB163068",
        "poolId": 1
      },
      {
        "address": "0x9CfD5a30DB1B925A92E796e5Ce37Fd0E66390Fe1",
        "poolId": 2
      }
    ],
    "stateId": "finalized",
    "validatorStatus": []
  }
}
```

---

## Totalsupply Endpoint

`totalsupply` is the only supported name for this endpoint.

### Input Params

| Required? |        Name         | Aliases |                                                                                  Description                                                                                  |  Type  |       Options       |  Default   | Depends On | Not Valid With |
| :-------: | :-----------------: | :-----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :----: | :-----------------: | :--------: | :--------: | :------------: |
|           | staderConfigAddress |         |                                                                  The address of the Stader Config contract.                                                                   | string |                     |            |            |                |
|           |       network       |         |                                                               The name of the target custodial network protocol                                                               | string |     `ethereum`      | `ethereum` |            |                |
|           |       chainId       |         |                                                                    The name of the target custodial chain                                                                     | string | `goerli`, `mainnet` | `mainnet`  |            |                |
|           |    confirmations    |         |                                                                The number of confirmations to query data from                                                                 | number |                     |            |            |                |
|           |     syncWindow      |         | The number of blocks Stader's reported block cannot be within of the current block. Used to ensure the balance and total supply feeds are reporting info from the same block. | number |                     |   `300`    |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "totalsupply",
    "chainId": "goerli",
    "network": "ethereum",
    "confirmations": 0,
    "syncWindow": 300
  }
}
```

---

MIT License
