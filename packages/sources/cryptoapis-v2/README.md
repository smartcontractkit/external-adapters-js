# Chainlink CryptoAPIs V2 External Adapter

### Environment Variables

### Environment Variables

| Required? |    Name     |                             Description                             | Options | Defaults to |
| :-------: | :---------: | :-----------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |   API_KEY   | An API key that can be obtained from [here](https://cryptoapis.io/) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                                               Options                                                               | Defaults to |
| :-------: | :------: | :-----------------: | :---------------------------------------------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [difficulty](#Difficulty-&-Height-Endpoint), [height](#Difficulty-&-Height-Endpoint), [balance](#Balance) |   `price`   |

---

## Price Endpoint

https://developers.cryptoapis.io/technical-documentation/market-data/exchange-rates/get-exchange-rate-by-asset-symbols

### Input Params

| Required? |                Name                |                      Description                       | Options | Defaults to |
| :-------: | :--------------------------------: | :----------------------------------------------------: | :-----: | :---------: |
|    ✅     |   `base`, `from`, `coin`    |          The symbol of the currency to query           |         |             |
|    ✅     | `quote`, `to`, `market` |        The symbol of the currency to convert to        |         |             |


### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "BTC",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": 33400.75300224127,
    "statusCode": 200,
    "data": {
        "apiVersion": "2.0.0",
        "requestId": "60ec5f2505bb78619df1fd97",
        "data": {
            "item": {
                "calculationTimestamp": 1626103576,
                "fromAssetId": "5b1ea92e584bf50020130612",
                "fromAssetSymbol": "BTC",
                "rate": "33400.75300224127",
                "toAssetId": "5b1ea92e584bf50020130615",
                "toAssetSymbol": "USD"
            }
        },
        "result": 33400.75300224127
    }
}
```

## Difficulty & Height Endpoint

 https://developers.cryptoapis.io/technical-documentation/blockchain-data/unified-endpoints/get-latest-mined-block

### Input Params

| Required? |              Name              |             Description             |                      Options                       | Defaults to |
| :-------: | :----------------------------: | :---------------------------------: | :------------------------------------------------: | :---------: |
|    ✅     | `blockchain`, `coin`, `market` | The blockchain to retrieve info for | `BTC`, `ETH`, `LTC`, `ETC`, `BCH`, `DOGE`, `DASH`. |             |
|           |           `network`            |     The blockchain network name     |                `mainnet`, `testnet`                |  `mainnet`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "difficulty",
    "blockchain": "BTC"
  }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": 14363025673659.96,
    "statusCode": 200,
    "data": {
        "apiVersion": "2.0.0",
        "requestId": "60ec5f5205bb78619df200ff",
        "data": {
            "item": {
                "hash": "0000000000000000000d96c617747cc9e1eea35c994c3b2f6f67f0942e04cb90",
                "height": 690715,
                "previousBlockHash": "00000000000000000008d1fa3519482540510e3604908e4332c0d3d5b1468d64",
                "timestamp": 1626102399,
                "transactionsCount": 2298,
                "blockchainSpecific": {
                    "difficulty": "14363025673659.96",
                    "nonce": 1309992080,
                    "size": 1441069,
                    "bits": "387160270",
                    "chainwork": "00000000000000000000000000000000000000001f71bc5ec7bbc6b5fcd4d2d8",
                    "merkleRoot": "5f72380e87bd119610cc314994a3cb66adcad182ab1432de513169d3d24b13cd",
                    "strippedSize": 850758,
                    "version": 545259524,
                    "versionHex": "20800004",
                    "weight": 3993343
                }
            }
        },
        "result": 14363025673659.96
    }
}
```

### Balance

https://developers.cryptoapis.io/technical-documentation/blockchain-data/unified-endpoints/get-address-details

| Required? |      Name       |                                 Description                                 | Options | Defaults to |
| :-------: | :-------------: | :-------------------------------------------------------------------------: | :-----: | :---------: |
|           |   `dataPath`    |                   Path where to find the addresses array                    |         |  `result`   |
|           | `confirmations` |                           Confirmations parameter                           |         |      6      |
|           |   `addresses`   | Array of addresses to query (this may also be under the `result` parameter) |         |             |

Addresses is an an array of objects that contain the following information:

| Required? |   Name    |                 Description                  |                  Options                  | Defaults to |
| :-------: | :-------: | :------------------------------------------: | :---------------------------------------: | :---------: |
|    ✅     | `address` |               Address to query               |                                           |             |
|           |  `coin`   |              Which blockchain to query from               | `btc`, `eth`, `bch`, `ltc`, `etc`, `bch`, `dash`, `doge` |    `btc`    |
|           |  `chain`  | Tells the adapter whether to query from mainnet or testnet.  Ethereum uses the Rinkeby testnet and Ethereum Classic uses the Mordor |           `mainnet`, `testnet`            |  `mainnet`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
        "chain": "testnet"
      }
    ],
    "dataPath": "addresses"
  }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": [
        {
            "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
            "coin": "btc",
            "chain": "mainnet",
            "balance": "0"
        },
        {
            "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
            "coin": "btc",
            "chain": "mainnet",
            "balance": "0.00003282"
        }
    ],
    "statusCode": 200,
    "data": {
        "responses": [
            {
                "apiVersion": "2.0.0",
                "requestId": "60ec5f808407797c236a7dd1",
                "data": {
                    "item": {
                        "transactionsCount": 60,
                        "confirmedBalance": {
                            "amount": "0",
                            "unit": "BTC"
                        },
                        "totalReceived": {
                            "amount": "3571.76171514",
                            "unit": "BTC"
                        },
                        "totalSpent": {
                            "amount": "3571.76171514",
                            "unit": "BTC"
                        },
                        "incomingTransactionsCount": 42,
                        "outgoingTransactionsCount": 42
                    }
                }
            },
            {
                "apiVersion": "2.0.0",
                "requestId": "60ec5f808407797c236a7dd0",
                "data": {
                    "item": {
                        "transactionsCount": 14,
                        "confirmedBalance": {
                            "amount": "0.00003282",
                            "unit": "BTC"
                        },
                        "totalReceived": {
                            "amount": "31295.44141234",
                            "unit": "BTC"
                        },
                        "totalSpent": {
                            "amount": "31295.44137952",
                            "unit": "BTC"
                        },
                        "incomingTransactionsCount": 6,
                        "outgoingTransactionsCount": 12
                    }
                }
            }
        ],
        "result": [
            {
                "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
                "coin": "btc",
                "chain": "mainnet",
                "balance": "0"
            },
            {
                "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
                "coin": "btc",
                "chain": "mainnet",
                "balance": "0.00003282"
            }
        ]
    }
}
```
