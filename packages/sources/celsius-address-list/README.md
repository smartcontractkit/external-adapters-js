# Chainlink External Adapter for Celsius Address List Wallet

![1.0.9](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/celsius-address-list/package.json)

This adapter fetches a list of addresses for the Proof of Reserves adapter. The custodial chain addresses are pulled from the Celsius Address Manager contract on an Ethereum chain. It is similar to the Chain Reserve Wallet adapter, except the input to the smart contract method is a `string` instead of `uint8`.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |                                        Description                                         |  Type  | Options | Default |
| :-------: | :-----: | :----------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | RPC_URL | The Ethereum RPC URL where the smart contract holding the custodial addresses is deployed. | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [wallet](#wallet-endpoint) | `wallet` |

## Wallet Endpoint

This endpoint returns a list of custodial chain addresses from an Ethereum smart contract.

`wallet` is the only supported name for this endpoint.

### Input Params

| Required? |      Name       | Aliases |                                 Description                                  |  Type  |  Options  | Default | Depends On | Not Valid With |
| :-------: | :-------------: | :-----: | :--------------------------------------------------------------------------: | :----: | :-------: | :-----: | :--------: | :------------: |
|    ✅     |     chainId     |         |                    The name of the target custodial chain                    | string | `mainnet` |         |            |                |
|    ✅     | contractAddress |         | The address of the Address Manager contract holding the custodial addresses. | string |           |         |            |                |
|    ✅     |     network     |         |              The name of the target custodial network protocol               | string | `bitcoin` |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "wallet",
    "chainId": "mainnet",
    "contractAddress": "0x0123456789abcdef0123456789abcdef01234567",
    "network": "bitcoin"
  },
  "debug": {
    "cacheKey": "yZJXHU2Ti5vX4r/EZwuu/pi9uMI="
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
        "address": "bc1q4gwx0f6yqurq0gwj9ktwlevrp3eu8snn5kaaax",
        "chainId": "mainnet",
        "network": "bitcoin"
      }
    ]
  },
  "result": [
    {
      "address": "bc1q4gwx0f6yqurq0gwj9ktwlevrp3eu8snn5kaaax",
      "chainId": "mainnet",
      "network": "bitcoin"
    }
  ],
  "statusCode": 200
}
```

---

MIT License
