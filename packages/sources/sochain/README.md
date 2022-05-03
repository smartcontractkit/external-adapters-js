# Chainlink External Adapters to query address balance from SoChain

![1.2.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/sochain/package.json)

Base URL https://sochain.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |        Default        |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------: |
|           | API_ENDPOINT |             | string |         | `https://sochain.com` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Aliases |                        Description                         |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :-----------: | :-----: | :--------------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|    ✅     |   addresses   |         | Array of objects with address information as defined below | array  |         |          |            |                |
|           | confirmations |         |                  Confirmations parameter                   | number |         |   `6`    |            |                |
|           |   dataPath    |         |           Path where to find the addresses array           | string |         | `result` |            |                |

Address objects within `addresses` have the following properties:

| Required? |  Name   |                 Description                  |  Type  |                    Options                    |  Default  |
| :-------: | :-----: | :------------------------------------------: | :----: | :-------------------------------------------: | :-------: |
|    ✅     | address |               Address to query               | string |                                               |           |
|           |  chain  | Chain to query (Ethereum testnet is Rinkeby) | string |             `mainnet`, `testnet`              | `mainnet` |
|           |  coin   |              Currency to query               | string | Ex. `bch`, `btc`, `btsv`, `eth`, `ltc`, `zec` |   `btc`   |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "dataPath": "addresses",
    "confirmations": 3,
    "addresses": [
      {
        "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
        "coin": "btc"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "btc"
      }
    ]
  },
  "debug": {
    "cacheKey": "AExDilGMUjYLkzTZ2d0iA6PbB40="
  },
  "rateLimitMaxAge": 222
}
```

Response:

```json
{
  "jobRunID": "1",
  "statusCode": 200,
  "data": {
    "responses": [
      {
        "status": "success",
        "data": {
          "network": "BTC",
          "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
          "confirmed_balance": "0.00000000",
          "unconfirmed_balance": null
        }
      },
      {
        "status": "success",
        "data": {
          "network": "BTC",
          "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
          "confirmed_balance": "0.00002188",
          "unconfirmed_balance": null
        }
      }
    ],
    "result": [
      {
        "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
        "coin": "BTC",
        "chain": "mainnet",
        "balance": "0"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "BTC",
        "chain": "mainnet",
        "balance": "2188"
      }
    ]
  },
  "result": [
    {
      "address": "3D8DJLwUXFfZvE8yJRu729MZ8uLy25SuLz",
      "coin": "BTC",
      "chain": "mainnet",
      "balance": "0"
    },
    {
      "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
      "coin": "BTC",
      "chain": "mainnet",
      "balance": "2188"
    }
  ]
}
```

---

MIT License
