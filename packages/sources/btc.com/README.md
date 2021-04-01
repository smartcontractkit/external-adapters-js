# Chainlink External Adapters to query address balance from BTC.com

### Environment Variables

The adapter takes the following environment variables:

| Required? |     Name      |    Description    | Options | Defaults to |
| :-------: | :-----------: | :---------------: | :-----: | :---------: |
|           | `API_TIMEOUT` | Timeout parameter |         |   `30000`   |

### Input Parameters

| Required? |   Name   |     Description     | Options | Defaults to |
| :-------: | :------: | :-----------------: | :-----: | :---------: |
|           | endpoint | The endpoint to use |         |  `balance`  |

## Balance Endpoint

### Input Params

| Required? |      Name       |                                 Description                                 | Options | Defaults to |
| :-------: | :-------------: | :-------------------------------------------------------------------------: | :-----: | :---------: |
|           |   `dataPath`    |                   Path where to find the addresses array                    |         |  `result`   |
|           | `confirmations` |                           Confirmations parameter                           |         |      6      |
|           |   `addresses`   | Array of addresses to query (this may also be under the `result` parameter) |         |             |

Addresses is an an array of objects that contain the following information:

| Required? |   Name    |                 Description                  | Options | Defaults to |
| :-------: | :-------: | :------------------------------------------: | :-----: | :---------: |
|    ✅     | `address` |               Address to query               |         |             |
|           |  `coin`   |              Currency to query               |         |    `btc`    |
|           |  `chain`  | Chain to query (Ethereum testnet is Rinkeby) |         |  `mainnet`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "coin": "btc"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "btc"
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
        "data": {
          "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
          "received": 331532014822,
          "sent": 331532014275,
          "balance": 547,
          "tx_count": 56,
          "unconfirmed_tx_count": 0,
          "unconfirmed_received": 0,
          "unconfirmed_sent": 0,
          "unspent_tx_count": 1
        },
        "err_code": 0,
        "err_no": 0,
        "message": "success",
        "status": "success"
      },
      {
        "data": {
          "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
          "received": 3129544141234,
          "sent": 3129544137952,
          "balance": 3282,
          "tx_count": 14,
          "unconfirmed_tx_count": 0,
          "unconfirmed_received": 0,
          "unconfirmed_sent": 0,
          "unspent_tx_count": 6
        },
        "err_code": 0,
        "err_no": 0,
        "message": "success",
        "status": "success"
      }
    ],
    "result": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 547
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "coin": "btc",
        "chain": "mainnet",
        "balance": 3282
      }
    ]
  },
  "result": [
    {
      "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "547"
    },
    {
      "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
      "coin": "btc",
      "chain": "mainnet",
      "balance": "3282"
    }
  ],
  "statusCode": 200
}
```
