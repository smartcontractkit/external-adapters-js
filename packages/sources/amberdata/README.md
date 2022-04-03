# Chainlink External Adapter for Amberdata

Version: 1.3.19

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |  Description   |  Type  | Options |        Default        |
| :-------: | :-------------: | :------------: | :----: | :-----: | :-------------------: |
|           |  API_ENDPOINT   |                | string |         | `https://web3api.io`  |
|    ✅     |     API_KEY     | API key to use | string |         |                       |
|           | WS_API_ENDPOINT |                | string |         | `wss://ws.web3api.io` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                                                 Options                                                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [crypto](#crypto-endpoint), [gasprice](#gasprice-endpoint), [marketcap](#token-endpoint), [price](#crypto-endpoint), [token](#token-endpoint), [volume](#volume-endpoint) |         |

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
    "addresses": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF"
      }
    ]
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
        "status": 200,
        "title": "OK",
        "description": "Successful request",
        "payload": {
          "address": {
            "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1"
          },
          "blockchainId": "408fa195a34b533de9ad9889f076045e",
          "blockNumber": "692934",
          "timestampNanoseconds": 0,
          "value": "0",
          "timestamp": "2021-07-27T17:18:38.000Z"
        }
      },
      {
        "status": 200,
        "title": "OK",
        "description": "Successful request",
        "payload": {
          "address": {
            "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF"
          },
          "blockchainId": "408fa195a34b533de9ad9889f076045e",
          "blockNumber": "693286",
          "timestampNanoseconds": 0,
          "value": "2188",
          "timestamp": "2021-07-29T20:54:39.000Z"
        }
      }
    ],
    "result": [
      {
        "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
        "chain": "mainnet",
        "coin": "btc",
        "balance": "0"
      },
      {
        "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
        "chain": "mainnet",
        "coin": "btc",
        "balance": "2188"
      }
    ]
  },
  "result": [
    {
      "address": "3EyjZ6CtEZEKyc719NZMyWaJpJG5jsVJL1",
      "chain": "mainnet",
      "coin": "btc",
      "balance": "0"
    },
    {
      "address": "38bzm6nhQMFJe71jJw1U7CbgNrVNpkonZF",
      "chain": "mainnet",
      "coin": "btc",
      "balance": "2188"
    }
  ]
}
```

---

## Crypto Endpoint

Gets the [latest spot VWAP price](https://docs.amberdata.io/reference#spot-price-pair-latest) from Amberdata.

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
    "endpoint": "crypto",
    "base": "ETH",
    "quote": "BTC"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": 200,
    "title": "OK",
    "description": "Successful request",
    "payload": {
      "timestamp": 1635171720000,
      "pair": "eth_btc",
      "price": "0.06567038",
      "volume": "19.40889537"
    },
    "result": 0.06567038
  },
  "result": 0.06567038,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Token Endpoint

Gets the asset USD Market Cap from Amberdata.

Supported names for this endpoint are: `marketcap`, `token`.

### Input Params

| Required? | Name |    Aliases     |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "marketcap",
    "base": "ETH"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": 200,
    "title": "OK",
    "description": "Successful request",
    "payload": [
      {
        "address": "0x0000000000000000000000000000000000000000",
        "circulatingSupply": "118070431.749",
        "dailyPercentChangeUSD": "1.74435577",
        "dailyVolumeUSD": "3041761.3870759335755552172",
        "hourlyPercentChangeUSD": "-0.10186964",
        "marketCapUSD": "490182085144.57404960",
        "name": "Ethereum",
        "priceUSD": "4151.60745907",
        "symbol": "ETH",
        "totalSupply": "0",
        "weeklyPercentChangeUSD": "5.86339376",
        "decimals": "0",
        "timestamp": 1635171660000
      },
      {
        "address": null,
        "circulatingSupply": "130450211.904084",
        "dailyPercentChangeUSD": "1.11713832",
        "dailyVolumeUSD": "3731155.3422029782460735630",
        "hourlyPercentChangeUSD": "-0.19217345",
        "marketCapUSD": "7227695967.14551282",
        "name": "Ethereum Classic",
        "priceUSD": "55.40578173",
        "symbol": "etc",
        "totalSupply": "210700000",
        "weeklyPercentChangeUSD": "3.33342720",
        "decimals": "0",
        "timestamp": 1635171660000
      },
      {
        "address": "0x871baed4088b863fd6407159f3672d70cd34837d",
        "circulatingSupply": "41714.27766728",
        "dailyPercentChangeUSD": "5.16547591",
        "dailyVolumeUSD": "2295.91738668127469573876",
        "hourlyPercentChangeUSD": "-0.64926265",
        "marketCapUSD": "88679851.27568739",
        "name": "ETHBULL",
        "priceUSD": "2125.88725575",
        "symbol": "ETHBULL",
        "totalSupply": "41714.27766728",
        "weeklyPercentChangeUSD": "12.28121442",
        "decimals": "0",
        "timestamp": 1635171660000
      },
      {
        "address": "0x239b0fa917d85c21cf6435464c2c6aa3d45f6720",
        "circulatingSupply": "0",
        "dailyPercentChangeUSD": "5.17998876",
        "dailyVolumeUSD": "49512.4313497482550886",
        "hourlyPercentChangeUSD": "-0.53618155",
        "marketCapUSD": "0.00000000",
        "name": "Amun Ether 3x Daily Long",
        "priceUSD": "20.90408393",
        "symbol": "ETH3L",
        "totalSupply": "2.1557",
        "weeklyPercentChangeUSD": "14.29317454",
        "decimals": "0",
        "timestamp": 1635171660000
      },
      {
        "address": null,
        "circulatingSupply": "0",
        "dailyPercentChangeUSD": "-4.11738780",
        "dailyVolumeUSD": "4755242.68",
        "hourlyPercentChangeUSD": "0.51625817",
        "marketCapUSD": "0.00000000",
        "name": "ETHDOWN",
        "priceUSD": "0.69542628",
        "symbol": "ethdown",
        "totalSupply": "0",
        "weeklyPercentChangeUSD": "-21.89288557",
        "decimals": "0",
        "timestamp": 1635171660000
      },
      {
        "address": null,
        "circulatingSupply": "0",
        "dailyPercentChangeUSD": "-6.16285344",
        "dailyVolumeUSD": "143342173430.1762126394",
        "hourlyPercentChangeUSD": "0.40664400",
        "marketCapUSD": "0.00000000",
        "name": "ETH3S",
        "priceUSD": "0.00000323",
        "symbol": "eth3s",
        "totalSupply": "0",
        "weeklyPercentChangeUSD": "-27.57141767",
        "decimals": "0",
        "timestamp": 1635171660000
      },
      {
        "address": null,
        "circulatingSupply": "0",
        "dailyPercentChangeUSD": null,
        "dailyVolumeUSD": "2.74122961",
        "hourlyPercentChangeUSD": null,
        "marketCapUSD": "0.00000000",
        "name": "Eth 2.0 Staking by Pool-X",
        "priceUSD": "3969.20323100",
        "symbol": "eth2",
        "totalSupply": "0",
        "weeklyPercentChangeUSD": "8.36446601",
        "decimals": "0",
        "timestamp": 0
      },
      {
        "address": null,
        "circulatingSupply": "0",
        "dailyPercentChangeUSD": "3.97114520",
        "dailyVolumeUSD": "70285.85",
        "hourlyPercentChangeUSD": "-0.27625685",
        "marketCapUSD": "0.00000000",
        "name": "ETHUP",
        "priceUSD": "105.78828525",
        "symbol": "ethup",
        "totalSupply": "0",
        "weeklyPercentChangeUSD": "11.78514923",
        "decimals": "0",
        "timestamp": 1635171660000
      },
      {
        "address": "0x10e1e953ddba597011f8bfa806ab0cc3415a622b",
        "circulatingSupply": "0",
        "dailyPercentChangeUSD": null,
        "dailyVolumeUSD": "8.57",
        "hourlyPercentChangeUSD": null,
        "marketCapUSD": "0.00000000",
        "name": "ETHHEDGE",
        "priceUSD": "14.49400000",
        "symbol": "ETHHEDGE",
        "totalSupply": "94",
        "weeklyPercentChangeUSD": "-5.70521649",
        "decimals": "0",
        "timestamp": 1635166320000
      },
      {
        "address": "0x2f5e2c9002c058c063d21a06b6cabb50950130c8",
        "circulatingSupply": "0",
        "dailyPercentChangeUSD": "-11.09861111",
        "dailyVolumeUSD": "246937622713.2395986845",
        "hourlyPercentChangeUSD": "-5.88447063",
        "marketCapUSD": "0.00000000",
        "name": "ETHBEAR",
        "priceUSD": "0.00000008",
        "symbol": "ETHBEAR",
        "totalSupply": "221",
        "weeklyPercentChangeUSD": "-10.01498919",
        "decimals": "0",
        "timestamp": 1635171240000
      }
    ],
    "result": 490182085144.57404
  },
  "result": 490182085144.57404,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |               Description                |  Type  |                 Options                 |      Default       | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :--------------------------------------: | :----: | :-------------------------------------: | :----------------: | :--------: | :------------: |
|           |   speed    |         |            The desired speed             | string | `average`, `fast`, `fastest`, `safeLow` |     `average`      |            |                |
|           | blockchain |         | The blockchain id to get gas prices from | string |                                         | `ethereum-mainnet` |            |                |

### Example

There are no examples for this endpoint.

---

## Volume Endpoint

Gets the [24h-volume for historical of a pair](https://docs.amberdata.io/reference#spot-price-pair-historical) from Amberdata.

`volume` is the only supported name for this endpoint.

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
    "endpoint": "volume",
    "base": "LINK",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "status": 200,
    "title": "OK",
    "description": "Successful request",
    "payload": {
      "metadata": {
        "startDate": 1635085961606,
        "endDate": 1635172361606
      },
      "data": [
        {
          "timestamp": 1635120000000,
          "pair": "link_usd",
          "price": "32.39881799",
          "volume": "13804511.82541564"
        }
      ]
    },
    "result": 13804511.82541564
  },
  "result": 13804511.82541564,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
