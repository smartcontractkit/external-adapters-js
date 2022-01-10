# Chainlink CryptoAPIs External Adapter

Version: 1.1.1

## Environment Variables

| Required? |    Name     |                             Description                             |  Type  | Options | Default |
| :-------: | :---------: | :-----------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   API_KEY   | An API key that can be obtained from [here](https://cryptoapis.io/) | string |         |         |
|           | API_TIMEOUT |                          Timeout parameter                          | number |         | `30000` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                        Options                                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [crypto](#crypto-endpoint), [bc_info](#bc_info-endpoint) | `crypto` |

---

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |     Name      | Aliases |                        Description                         |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :-----------: | :-----: | :--------------------------------------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|    ✅     |   addresses   |         | Array of objects with address information as defined below | array  |         |          |            |                |
|           | confirmations |         |                  Confirmations parameter                   | number |         |   `6`    |            |                |
|           |   dataPath    |         |           Path where to find the addresses array           | string |         | `result` |            |                |

Address objects within `addresses` have the following properties:

| Required? |  Name   |                 Description                  |  Type  |                  Options                  |  Default  |
| :-------: | :-----: | :------------------------------------------: | :----: | :---------------------------------------: | :-------: |
|    ✅     | address |               Address to query               | string |                                           |           |
|           |  chain  | Chain to query (Ethereum testnet is Rinkeby) | string |           `mainnet`, `testnet`            | `mainnet` |
|           |  coin   |              Currency to query               | string | `bch`, `btc`, `btsv`, `eth`, `ltc`, `zec` |   `btc`   |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "dataPath": "addresses",
    "addresses": [
      {
        "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
        "chain": "testnet"
      }
    ]
  }
}
```

Response:

```json
{
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
}
```

---

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `from`, `coin` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `to`, `market` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "base": "BTC",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "payload": {
    "weightedAveragePrice": 64671.845340501786,
    "amount": 2.2908423,
    "timestamp": 1636989278,
    "datetime": "2021-11-15T15:14:38+0000",
    "baseAsset": "BTC",
    "quoteAsset": "USD"
  },
  "result": 64671.845340501786
}
```

---

## Bc_info Endpoint

Supported names for this endpoint are: `height`, `difficulty`.

### Input Params

| Required? |    Name    |     Aliases      |             Description             |  Type  |                      Options                      |  Default  | Depends On | Not Valid With |
| :-------: | :--------: | :--------------: | :---------------------------------: | :----: | :-----------------------------------------------: | :-------: | :--------: | :------------: |
|    ✅     | blockchain | `coin`, `market` | The blockchain to retrieve info for | string | `BTC`, `ETH`, `LTC`, `ETC`, `BCH`, `DOGE`, `DASH` |           |            |                |
|           | resultPath |                  |       The path for the result       | string |                                                   |           |            |                |
|    ✅     |  network   |                  |     The blockchain network name     | string |                                                   | `mainnet` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "difficulty",
    "blockchain": "BTC",
    "resultPath": "difficulty",
    "network": "mainnet"
  }
}
```

Response:

```json
{
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
}
```
