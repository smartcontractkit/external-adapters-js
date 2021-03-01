# Chainlink External Adapter for Amberdata

## Configuration

The adapter takes the following environment variables:

- `API_KEY`: Optional API key to use
- `API_TIMEOUT`: Optional timeout param, defaults to `30000`

### Input Parameters

| Required? |   Name   |     Description     |                        Options                         | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [balance](#Balance-Endpoint), [marketcap](#MarketCap-Endpoint) |    price    |

---

## Price Endpoint

Gets the [latest spot VWAP price](https://docs.amberdata.io/reference#spot-price-pair-latest) from Amberdata.

### Input Params

- `base`, `from`, or `coin`: The asset to query
- `quote`, `to`, or `market`: The currency to convert to
- `overrides`: (not required) If base provided is found in overrides, that will be used. [Format](../external-adapter/src/overrides/presetSymbols.json)

### Output

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

## Balance Endpoint

### Input Params

- `dataPath`: Optional path where to find the addresses array, defaults to `result`
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
      }
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

## MarketCap Endpoint

Gets the asset USD Market Cap from Amberdata.

### Input Params

- `base`, `from`, or `coin`: The asset to query

### Output

```json
{
  "jobRunID": "1",
  "result": 882396855649.2188,
  "statusCode": 200,
  "data": {
    "status": 200,
    "title": "OK",
    "description": "Successful request",
    "payload": [
      {
        "address": null,
        "circulatingSupply": "18641681",
        "dailyPercentChangeUSD": "4.07699683",
        "dailyVolumeUSD": "169547.8348362793",
        "hourlyPercentChangeUSD": "0.44095348",
        "marketCapUSD": "882396855649.21876233",
        "name": "Bitcoin",
        "priceUSD": "47334.61835600",
        "symbol": "btc",
        "totalSupply": "21000000",
        "weeklyPercentChangeUSD": "-27.13252210",
        "decimals": "0",
        "timestamp": 1614591360000
      },
      {...}
    ],
    "result": 882396855649.2188
  }
}

```
