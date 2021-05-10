# Chainlink External Adapters to query address balance from BTC.com

## Configuration

The adapter takes the following environment variables:

- `API_KEY`
- `API_SECRET`
- `API_TIMEOUT`: Optional timeout param, defaults to `30000`

## Input Params

- `endpoint`: Optional endpoint param, defaults to `balance`

### Balance endpoint

- `dataPath`: Optional path where to find the addresses array, defaults to `result`
- `confirmations`: Optional confirmations param, defaults to `6`

- `addresses`: Addresses to query

  {

  - `address`: Address to query
  - `coin`: Optional currency to query, defaults to `btc`
  - `chain`: Optional chain to query, defaults to `mainnet`

  }

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

### Output

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
