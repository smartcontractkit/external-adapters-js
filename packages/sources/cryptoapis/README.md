# Chainlink External Adapter for CryptoAPIs

![1.2.36](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptoapis/package.json) ![v2](https://img.shields.io/badge/framework%20version-v2-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decide to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

## Environment Variables

| Required? |    Name     |                             Description                             |  Type  | Options | Default |
| :-------: | :---------: | :-----------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   API_KEY   | An API key that can be obtained from [here](https://cryptoapis.io/) | string |         |         |
|           | API_TIMEOUT |                          Timeout parameter                          | number |         | `30000` |

---

## Data Provider Rate Limits

|     Name     | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :----------: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
|     free     |              3              |                             |           20.83           |      |
|    growth    |             10              |                             |       104.166666667       |      |
|   startup    |             20              |                             |           312.5           |      |
| partnership  |             30              |                             |           937.5           |      |
| professional |             40              |                             |          2812.5           |      |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                      Options                                                                      | Default  |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [crypto](#crypto-endpoint), [difficulty](#bc_info-endpoint), [height](#bc_info-endpoint), [price](#crypto-endpoint) | `crypto` |

## Balance Endpoint

https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/btc/index#btc-address-info-endpoint

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
    "dataPath": "addresses",
    "addresses": [
      {
        "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
        "chain": "testnet"
      }
    ],
    "endpoint": "balance"
  },
  "debug": {
    "cacheKey": "bMYi1u3EPmP0Xyfhsf/Ofqh3y8c="
  }
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
        "payload": {
          "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
          "totalSpent": "0.0498",
          "totalReceived": "135.74870753",
          "balance": "135.69890753",
          "txi": 1,
          "txo": 1958,
          "txsCount": 1944,
          "addresses": ["n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF"]
        }
      }
    ],
    "result": [
      {
        "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
        "chain": "testnet",
        "coin": "btc",
        "balance": "13569890753"
      }
    ]
  },
  "result": [
    {
      "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
      "chain": "testnet",
      "coin": "btc",
      "balance": "13569890753"
    }
  ]
}
```

---

## Crypto Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "BTC",
    "quote": "USD",
    "endpoint": "crypto"
  },
  "debug": {
    "cacheKey": "r6ZXhd+zEdyag6axryIefPg9QnI="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": {
      "weightedAveragePrice": 64671.845340501786,
      "amount": 2.2908423,
      "timestamp": 1636989278,
      "datetime": "2021-11-15T15:14:38+0000",
      "baseAsset": "BTC",
      "quoteAsset": "USD"
    },
    "result": 64671.845340501786
  },
  "result": 64671.845340501786,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Bc_info Endpoint

https://docs.cryptoapis.io/rest-apis/blockchain-as-a-service-apis/common/index#common

Supported names for this endpoint are: `difficulty`, `height`.

### Input Params

| Required? |    Name    |     Aliases      |             Description             |  Type  |                      Options                      |  Default  | Depends On | Not Valid With |
| :-------: | :--------: | :--------------: | :---------------------------------: | :----: | :-----------------------------------------------: | :-------: | :--------: | :------------: |
|    ✅     | blockchain | `coin`, `market` | The blockchain to retrieve info for | string | `BCH`, `BTC`, `DASH`, `DOGE`, `ETC`, `ETH`, `LTC` |           |            |                |
|    ✅     |  network   |                  |     The blockchain network name     | string |                                                   | `mainnet` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "blockchain": "BTC",
    "network": "mainnet",
    "endpoint": "difficulty",
    "resultPath": "difficulty"
  },
  "debug": {
    "cacheKey": "MpZFMEY8zxa0dHOlTifGLkwLqSc="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": {
      "difficulty": 22674148233453.11,
      "headers": 709848,
      "chain": "main",
      "chainWork": "000000000000000000000000000000000000000024275e7297eb45d00a73320f",
      "mediantime": 1636987430,
      "blocks": 709848,
      "bestBlockHash": "000000000000000000097d3bd56240cba422ae3ffd42c5a8fe349157f3de6c20",
      "currency": "BTC",
      "transactions": 686990377,
      "verificationProgress": 0.9999988307165758
    },
    "result": 22674148233453.11
  },
  "result": 22674148233453.11,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
