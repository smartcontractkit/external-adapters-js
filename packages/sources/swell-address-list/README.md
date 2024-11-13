# Swell Address List Adapter

![1.0.19](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/swell-address-list/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This EA fetches the list of custodial addresses that hold the funds for a PoR feed

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                                     Description                                      |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL | The RPC URL to connect to the EVM chain the address manager contract is deployed to. | string |         |         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint) | `address` |

## Address Endpoint

This EA fetches the list of custodial addresses that hold the funds for a PoR feed

`address` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases |                                 Description                                  |  Type  |       Options       |  Default   | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :--------------------------------------------------------------------------: | :----: | :-----------------: | :--------: | :--------: | :------------: |
|           | contractAddress |         | The address of the Address Manager contract holding the custodial addresses. | string |                     |            |            |                |
|           |  confirmations  |         |                The number of confirmations to query data from                |        |                     |            |            |                |
|           |     chainId     |         |                    The name of the target custodial chain                    | string | `goerli`, `mainnet` | `mainnet`  |            |                |
|           |     network     |         |              The name of the target custodial network protocol               | string |     `ethereum`      | `ethereum` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "contractAddress": "0x203E97cF02dB2aE52c598b2e5e6c6A778EB1987B",
    "confirmations": 0,
    "chainId": "mainnet",
    "network": "ethereum",
    "endpoint": "address"
  },
  "debug": {
    "cacheKey": "ZiT5YTZO2VlrAe9KvJ9Ta+yHsXE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "addressList": [
      {
        "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x976ea74026e726554db657fa54763abd0c3a0aa9",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
        "network": "ethereum",
        "chainId": "mainnet"
      }
    ],
    "result": [
      {
        "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x976ea74026e726554db657fa54763abd0c3a0aa9",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
        "network": "ethereum",
        "chainId": "mainnet"
      },
      {
        "address": "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
        "network": "ethereum",
        "chainId": "mainnet"
      }
    ]
  },
  "result": [
    {
      "address": "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x70997970c51812dc3a010c7d01b50e0d17dc79c8",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x90f79bf6eb2c4f870365e785982e1f101e93b906",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x15d34aaf54267db7d7c367839aaf71a00a2c6a65",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x9965507d1a55bcc2695c58ba16fb37d819b0a4dc",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x976ea74026e726554db657fa54763abd0c3a0aa9",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x14dc79964da2c08b23698b3d3cc7ca32193d9955",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0x23618e81e3f5cdf7f54c3d65f7fbc0abf5b21e8f",
      "network": "ethereum",
      "chainId": "mainnet"
    },
    {
      "address": "0xa0ee7a142d267c1f36714e4a8f75612f20a79720",
      "network": "ethereum",
      "chainId": "mainnet"
    }
  ],
  "statusCode": 200
}
```

---

MIT License
