# Chainlink External Adapter for Amberdata

### Environment Variables

The adapter takes the following environment variables:

| Required? |     Name      |    Description    | Options | Defaults to |
| :-------: | :-----------: | :---------------: | :-----: | :---------: |
|    ✅     |   `API_KEY`   |  API key to use   |         |             |
|           | `API_TIMEOUT` | Timeout parameter |         |   `30000`   |

### Input Parameters

| Required? |    Name    |     Description     |                                         Options                                          | Defaults to |
| :-------: | :--------: | :-----------------: | :--------------------------------------------------------------------------------------: | :---------: |
|           | `endpoint` | The endpoint to use | [price](#Price-Endpoint), [balance](#Balance-Endpoint), [marketcap](#MarketCap-Endpoint) |   `price`   |

---

## Price Endpoint

Gets the [latest spot VWAP price](https://docs.amberdata.io/reference#spot-price-pair-latest) from Amberdata.

### Input Params

| Required? |            Name            |                        Description                        |                                       Options                                        | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------: | :----------------------------------------------------------------------------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |            The symbol of the currency to query            |                                                                                      |             |
|    ✅     | `quote`, `to`, or `market` |         The symbol of the currency to convert to          |                                                                                      |             |
|           |        `overrides`         | If base provided is found in overrides, that will be used | [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "LINK",
    "quote": "USD"
  }
}
```

### Sample Output

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

| Required? |      Name       |                                 Description                                 | Options | Defaults to |
| :-------: | :-------------: | :-------------------------------------------------------------------------: | :-----: | :---------: |
|           |   `dataPath`    |                   Path where to find the addresses array                    |         |  `result`   |
|           | `confirmations` |                           Confirmations parameter                           |         |      6      |
|           |   `addresses`   | Array of addresses to query (this may also be under the `result` parameter) |         |             |

Addresses is an an array of objects that contain the following information:

| Required? |   Name    |                 Description                  |                  Options                  | Defaults to |
| :-------: | :-------: | :------------------------------------------: | :---------------------------------------: | :---------: |
|    ✅     | `address` |               Address to query               |                                           |             |
|           |  `coin`   |              Currency to query               | `btc`. `eth`, `bch`, `ltc`, `btsv`, `zec` |    `btc`    |
|           |  `chain`  | Chain to query (Ethereum testnet is Rinkeby) |           `mainnet`, `testnet`            |  `mainnet`  |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "balance",
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

### Sample Output

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

| Required? |           Name            |           Description            | Options | Defaults to |
| :-------: | :-----------------------: | :------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin` | The symbol of the asset to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "marketcap",
    "base": "ETH"
  }
}
```

### Sample Output

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
