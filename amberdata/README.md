# Chainlink External Adapter for Amberdata

## Configuration

The adapter takes the following environment variables:

- `API_KEY`: Optional Blochair API key to use
- `API_TIMEOUT`: Optional timeout param, defaults to `30000`

## Input Params

- `endpoint`: The endpoint to use. Default: "price"

### Price endpoint

Gets the [latest spot VWAP price](https://docs.amberdata.io/reference#spot-price-pair-latest) from Amberdata.

## Input Params

- `base`, `from`, or `coin`: The asset to query
- `quote`, `to`, or `market`: The currency to convert to

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": 200,
    "title": "OK",
    "description": "Successful request",
    "payload": {
      "timestamp": 1603800660000,
      "pair": "link_usd",
      "price": "12.02087667",
      "volume": "508.31"
    },
    "result": 12.02087667
  },
  "result": 12.02087667,
  "statusCode": 200
}
```

### Balance endpoint

- `dataPath`: Optional path where to find the addresses array, defaults to `addresses`
- `confirmations`: Optional confirmations param, defaults to `6`

- `addresses`: Addresses to query

  {

  - `address`: Address to query
  - `coin`: Optional currency to query, defaults to `btc`, one of `(btc|eth|bch|ltc|btsv|zec)`
  - `chain`: Optional chain to query, defaults to `mainnet`, one of `(mainnet|testnet)` when querying ethereum. Returns Rinkeby data.

  }

```json
{
  "id": "1",
  "data": {
    "addresses": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF"
      },
      {
        "address": "3ANaBZ6odMrzdg9xifgRNxAUFUxnReesws"
      },
      {
        "address": "3FFgKaYkEf1M73QtzuY9DGqC7VeM2sAQhT"
      },
      {
        "address": "3KTeq879YjzhqkAXzZmdapJAVC6qz5qEth"
      },
      {
        "address": "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR"
      }
    ]
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
        "status": 200,
        "title": "OK",
        "description": "Successful request",
        "payload": {
          "address": { "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1" },
          "blockchainId": "408fa195a34b533de9ad9889f076045e",
          "blockNumber": "656338",
          "timestampNanoseconds": 0,
          "value": "547",
          "timestamp": "2020-11-10T19:54:09.000Z"
        }
      },
      {
        "status": 200,
        "title": "OK",
        "description": "Successful request",
        "payload": {
          "address": { "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF" },
          "blockchainId": "408fa195a34b533de9ad9889f076045e",
          "blockNumber": "653986",
          "timestampNanoseconds": 0,
          "value": "3282",
          "timestamp": "2020-10-23T17:28:35.000Z"
        }
      },
    ],
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
      },
  ],
  "statusCode": 200
}
```
