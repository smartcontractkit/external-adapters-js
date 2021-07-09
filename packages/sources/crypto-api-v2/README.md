# Chainlink CryptoAPIs External Adapter

### Environment Variables

| Required? |    Name     |                             Description                             | Options | Defaults to |
| :-------: | :---------: | :-----------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |   API_KEY   | An API key that can be obtained from [here](https://cryptoapis.io/) |         |             |
|           | API_TIMEOUT |                          Timeout parameter                          |         |   `30000`   |

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
|    ✅     |   `base`, `from`, `coin`, `sym`    |          The symbol of the currency to query           |         |             |
|    ✅     | `quote`, `to`, `market`, `convert` |        The symbol of the currency to convert to        |         |             |
|           |               `cid`                |  The CMC coin ID (optional to use in place of `base`)  |         |             |
|           |               `slug`               | The CMC coin name (optional to use in place of `base`) |         |             |

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
  "data": {
    "payload": {
      "weightedAveragePrice": 36670.69405468086,
      "amount": 135.37338203000004,
      "timestamp": 1610724372,
      "datetime": "2021-01-15T15:26:12+0000",
      "baseAsset": "BTC",
      "quoteAsset": "USD"
    },
    "result": 36670.69405468086
  },
  "result": 36670.69405468086,
  "statusCode": 200
}
```

## Difficulty & Height Endpoint

https://developers.cryptoapis.io/technical-documentation/blockchain-data/unified-endpoints/get-latest-mined-block

### Input Params

'bitcoin', 'ethereum', 'ethereum-classic', 'bitcoin-cash', 'litecoin', 'dash', 'dogecoin'

| Required? |              Name              |             Description             |                      Options                       | Defaults to |
| :-------: | :----------------------------: | :---------------------------------: | :------------------------------------------------: | :---------: |
|    ✅     | `blockchain`, `coin`, `market` | The blockchain to retrieve info for | `bitcoin`, `ethereum`, `ethereum-classic`, `bitcoin-cash`, `litecoin`, `dash`, `dogecoin`. |             |
|           |           `network`            |     The blockchain network name     |                `mainnet`, `testnet`                |  `mainnet`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "difficulty",
    "blockchain": "bitcoin"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "payload": {
      "difficulty": 20607418304385.63,
      "headers": 666185,
      "chain": "main",
      "chainWork": "000000000000000000000000000000000000000018255ab714d1a15ffccd987e",
      "mediantime": 1610721116,
      "blocks": 666185,
      "bestBlockHash": "0000000000000000000cc82b0a9a6e290cd13721a1abf88fdebb37fdc927308e",
      "currency": "BTC",
      "transactions": 606560353,
      "verificationProgress": 0.9999930065052965
    },
    "result": 20607418304385.63
  },
  "result": 20607418304385.63,
  "statusCode": 200
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
|           |  `coin`   |              Currency to query               | `bitcoin`. `bitcoin-cash`, `litecoin`, `dogecoin`, `fash`, `ethereum`, `ethereum-classic` |    `bitcoin`    |
|           |  `chain`  | Chain to query (Ethereum testnet is Rinkeby) |           `mainnet`, `testnet`            |  `mainnet`  |

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
  "data": {
    "responses": [
      {
        "payload": {
          "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
          "totalSpent": "0.0498",
          "totalReceived": "131.40923575",
          "balance": "131.35943575",
          "txi": 1,
          "txo": 1590,
          "txsCount": 1587,
          "addresses": ["n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF"]
        }
      }
    ],
    "result": [
      {
        "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
        "chain": "testnet",
        "coin": "btc",
        "balance": "131.35943575"
      }
    ]
  },
  "result": [
    {
      "address": "n4VQ5YdHf7hLQ2gWQYYrcxoE5B7nWuDFNF",
      "chain": "testnet",
      "coin": "btc",
      "balance": "13135943575"
    }
  ],
  "statusCode": 200
}
```
