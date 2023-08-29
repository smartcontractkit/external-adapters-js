# STADER_ADDRESS_LIST

![2.3.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/stader-address-list/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options | Default |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |        RPC_URL        |   The RPC URL to connect to the EVM chain the address manager contract is deployed to.    | string |         |         |
|           |       CHAIN_ID        |                                The chain id to connect to                                 | number |         |   `1`   |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         | `10000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint) | `address` |

## Address Endpoint

`address` is the only supported name for this endpoint.

### Input Params

| Required? |            Name            | Aliases |                                                                                  Description                                                                                  |   Type   |       Options       |  Default   | Depends On | Not Valid With |
| :-------: | :------------------------: | :-----: | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :-----------------: | :--------: | :--------: | :------------: |
|           |     poolFactoryAddress     |         |                                                                The address of the Stader PoolFactory contract.                                                                |  string  |                     |            |            |                |
|           | permissionlessNodeRegistry |         |                                                       The address of the Stader Permissionless Node Registry contract.                                                        |  string  |                     |            |            |                |
|           |    stakeManagerAddress     |         |                                                               The address of the Stader StakeManager contract.                                                                |  string  |                     |            |            |                |
|           |       penaltyAddress       |         |                                                                  The address of the Stader Penalty contract.                                                                  |  string  |                     |            |            |                |
|           |  permissionedPoolAddress   |         |                                                                 The address of the Stader Permissioned Pool.                                                                  |  string  |                     |            |            |                |
|           |    staderConfigAddress     |         |                                                                  The address of the Stader Config contract.                                                                   |  string  |                     |            |            |                |
|           |    staderOracleAddress     |         |                                                                  The address of the Stader Oracle contract.                                                                   |  string  |                     |            |            |                |
|           |       confirmations        |         |                                                                The number of confirmations to query data from                                                                 |  number  |                     |            |            |                |
|           |          chainId           |         |                                                                    The name of the target custodial chain                                                                     |  string  | `goerli`, `mainnet` | `mainnet`  |            |                |
|           |          network           |         |                                                               The name of the target custodial network protocol                                                               |  string  |     `ethereum`      | `ethereum` |            |                |
|           |      validatorStatus       |         |                                                                 A filter to apply validators by their status                                                                  | string[] |                     |            |            |                |
|           |         batchSize          |         |                                                         The number of addresses to fetch from the contract at a time                                                          |  number  |                     |    `10`    |            |                |
|           |         syncWindow         |         | The number of blocks Stader's reported block cannot be within of the current block. Used to ensure the balance and total supply feeds are reporting info from the same block. |  number  |                     |   `300`    |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "confirmations": 0,
    "chainId": "goerli",
    "network": "ethereum",
    "includedRegistrationStatus": true,
    "endpoint": "address"
  },
  "debug": {
    "cacheKey": "VCLVd7BQnZKqbf/GZcJ+PTmW6wI="
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
        "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "registrationStatus": true,
        "network": "ethereum",
        "chainId": "goerli"
      },
      {
        "address": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "registrationStatus": true,
        "network": "ethereum",
        "chainId": "goerli"
      },
      {
        "address": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
        "registrationStatus": true,
        "network": "ethereum",
        "chainId": "goerli"
      },
      {
        "address": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
        "registrationStatus": true,
        "network": "ethereum",
        "chainId": "goerli"
      },
      {
        "address": "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
        "registrationStatus": true,
        "network": "ethereum",
        "chainId": "goerli"
      },
      {
        "address": "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
        "registrationStatus": true,
        "network": "ethereum",
        "chainId": "goerli"
      },
      {
        "address": "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
        "registrationStatus": true,
        "network": "ethereum",
        "chainId": "goerli"
      },
      {
        "address": "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
        "registrationStatus": true,
        "network": "ethereum",
        "chainId": "goerli"
      }
    ]
  },
  "result": [
    {
      "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "registrationStatus": true,
      "network": "ethereum",
      "chainId": "goerli"
    },
    {
      "address": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "registrationStatus": true,
      "network": "ethereum",
      "chainId": "goerli"
    },
    {
      "address": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      "registrationStatus": true,
      "network": "ethereum",
      "chainId": "goerli"
    },
    {
      "address": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      "registrationStatus": true,
      "network": "ethereum",
      "chainId": "goerli"
    },
    {
      "address": "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
      "registrationStatus": true,
      "network": "ethereum",
      "chainId": "goerli"
    },
    {
      "address": "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
      "registrationStatus": true,
      "network": "ethereum",
      "chainId": "goerli"
    },
    {
      "address": "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
      "registrationStatus": true,
      "network": "ethereum",
      "chainId": "goerli"
    },
    {
      "address": "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
      "registrationStatus": true,
      "network": "ethereum",
      "chainId": "goerli"
    }
  ],
  "statusCode": 200
}
```

---

MIT License
