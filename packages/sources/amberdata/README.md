# Chainlink External Adapter for Amberdata

![1.4.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/amberdata/package.json)

Base URL wss://ws.web3api.io

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |  Description   |  Type  | Options |        Default        |
| :-------: | :-------------: | :------------: | :----: | :-----: | :-------------------: |
|           |  API_ENDPOINT   |                | string |         | `https://web3api.io`  |
|    ✅     |     API_KEY     | API key to use | string |         |                       |
|           | WS_API_ENDPOINT |                | string |         | `wss://ws.web3api.io` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                                                                                                 Options                                                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [crypto](#crypto-endpoint), [gasprice](#gasprice-endpoint), [marketcap](#token-endpoint), [price](#crypto-endpoint), [token](#token-endpoint), [volume](#volume-endpoint) |         |

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
  },
  "debug": {
    "cacheKey": "vCmH76Knp2AjvjUGa4OTDci2XsE="
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
  },
  "debug": {
    "cacheKey": "Eao0YPhZDa3+RmRxiwOG5dAIIt0="
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
  },
  "debug": {
    "cacheKey": "WoWL21wG8PjLNnVF3S48gXtlKS0="
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
      "data": [
        {
          "address": null,
          "changeInPrice": "0.37263038",
          "changeInPriceHourly": "0.08625363",
          "changeInPriceDaily": "0.37263038",
          "changeInPriceWeekly": "12.93140876",
          "currentPrice": "43855",
          "decimals": "8",
          "marketCap": "831998990175.00000000",
          "liquidMarketCap": "833475501880.00000000",
          "name": "Bitcoin",
          "rank": 1,
          "symbol": "btc",
          "circulatingSupply": "19005256.00000000",
          "totalSupply": "21000000.00000000",
          "maxSupply": "21000000.00000000",
          "tokenVelocity": null,
          "transactionVolume": null,
          "uniqueAddresses": null,
          "tradeVolume": "30152193531",
          "specifications": [],
          "blockchain": {
            "name": "Bitcoin",
            "slug": "bitcoin",
            "symbol": "btc",
            "blockchainId": "408fa195a34b533de9ad9889f076045e",
            "icon": "https://amberdata.io/digital-assets/bitcoin_btc.png"
          }
        },
        {
          "address": "0x0000000000000000000000000000000000000000",
          "changeInPrice": "1.36453692",
          "changeInPriceHourly": "0.22047120",
          "changeInPriceDaily": "1.36453692",
          "changeInPriceWeekly": "13.18065598",
          "currentPrice": "3258.14",
          "decimals": "18",
          "marketCap": "391118025366.00000000",
          "liquidMarketCap": "391889354102.30436000",
          "name": "Ethereum",
          "rank": 2,
          "symbol": "eth",
          "circulatingSupply": "120280084.37400000",
          "totalSupply": "0.00000000",
          "maxSupply": "0.00000000",
          "tokenVelocity": null,
          "transactionVolume": "4",
          "uniqueAddresses": "15",
          "tradeVolume": "21319962730",
          "specifications": [],
          "blockchain": {
            "blockchainId": "1c9c969065fcd1cf",
            "name": "Ethereum",
            "slug": "ethereum-mainnet",
            "symbol": "ETH",
            "icon": "https://amberdata.io/digital-assets/ethereum_eth.png"
          }
        },
        {
          "address": "0xdac17f958d2ee523a2206206994597c13d831ec7",
          "changeInPrice": "0.02557981",
          "changeInPriceHourly": "-0.00726166",
          "changeInPriceDaily": "0.02557981",
          "changeInPriceWeekly": "0.00254792",
          "currentPrice": "1.001",
          "decimals": "6",
          "marketCap": "82545983982.00000000",
          "liquidMarketCap": "82524372511.93165030",
          "name": "Tether",
          "rank": 3,
          "symbol": "usdt",
          "circulatingSupply": "82441930581.35030000",
          "totalSupply": "82441930581.35030000",
          "maxSupply": "0.00000000",
          "tokenVelocity": "0.000000829497412104897645",
          "transactionVolume": "19606",
          "uniqueAddresses": "30176",
          "tradeVolume": "70291831456",
          "specifications": [],
          "blockchain": {
            "name": "Tether",
            "slug": "tether",
            "symbol": "usdt",
            "blockchainId": "37a737559c60d6ccd27f480f43fb6315",
            "icon": "https://amberdata.io/digital-assets/tether_usdt.png"
          }
        },
        {
          "address": "0xb8c77482e45f1f44de1745f52c74426c631bdd52",
          "changeInPrice": "0.64542255",
          "changeInPriceHourly": "0.07566162",
          "changeInPriceDaily": "0.64542255",
          "changeInPriceWeekly": "7.87028475",
          "currentPrice": "435.85",
          "decimals": "18",
          "marketCap": "73188247110.00000000",
          "liquidMarketCap": "73282527097.01500000",
          "name": "BNB",
          "rank": 4,
          "symbol": "bnb",
          "circulatingSupply": "168137035.90000000",
          "totalSupply": "168137035.90000000",
          "maxSupply": "168137035.90000000",
          "tokenVelocity": "0.000000279533891794984355",
          "transactionVolume": "26",
          "uniqueAddresses": "41",
          "tradeVolume": "2157430729",
          "specifications": [],
          "blockchain": {
            "name": "BNB",
            "slug": "bnb",
            "symbol": "bnb",
            "blockchainId": "9e15d2ff4304dbdd5911c578e378ea7d",
            "icon": "https://amberdata.io/digital-assets/bnb_bnb.png"
          }
        },
        {
          "address": "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
          "changeInPrice": "0.01946763",
          "changeInPriceHourly": "0.03602430",
          "changeInPriceDaily": "0.01946763",
          "changeInPriceWeekly": "-0.05031350",
          "currentPrice": "0.99806",
          "decimals": "6",
          "marketCap": "51015136607.00000000",
          "liquidMarketCap": "51052318806.52545106",
          "name": "USD Coin",
          "rank": 5,
          "symbol": "usdc",
          "circulatingSupply": "51151552818.99430000",
          "totalSupply": "51147544963.25040000",
          "maxSupply": "0.00000000",
          "tokenVelocity": "0.000000890415733942850127",
          "transactionVolume": "9184",
          "uniqueAddresses": "16686",
          "tradeVolume": "5171104710",
          "specifications": [],
          "blockchain": {
            "name": "USD Coin",
            "slug": "usd coin",
            "symbol": "usdc",
            "blockchainId": "6f8d8ab777acddf39b65ff23f8a2f6cb",
            "icon": "https://amberdata.io/digital-assets/usdcoin_usdc.png"
          }
        },
        {
          "address": "0xd31a59c85ae9d8edefec411d448f90841571b89c",
          "changeInPrice": "4.79736149",
          "changeInPriceHourly": "-0.26826092",
          "changeInPriceDaily": "4.79736149",
          "changeInPriceWeekly": "16.26114916",
          "currentPrice": "117.69",
          "decimals": "9",
          "marketCap": "38244726355.00000000",
          "liquidMarketCap": "38392939039.77411810",
          "name": "Solana",
          "rank": 6,
          "symbol": "sol",
          "circulatingSupply": "326220911.20549000",
          "totalSupply": "508180963.57000000",
          "maxSupply": "0.00000000",
          "tokenVelocity": null,
          "transactionVolume": null,
          "uniqueAddresses": null,
          "tradeVolume": "2986682703",
          "specifications": [],
          "blockchain": {
            "name": "Solana",
            "slug": "solana",
            "symbol": "sol",
            "blockchainId": "052c3c21c027fa269bad3a43219a2b1e",
            "icon": "https://amberdata.io/digital-assets/solana_sol.png"
          }
        },
        {
          "address": null,
          "changeInPrice": "-0.86619384",
          "changeInPriceHourly": "-0.07741811",
          "changeInPriceDaily": "-0.86619384",
          "changeInPriceWeekly": "2.99729023",
          "currentPrice": "0.788355",
          "decimals": "6",
          "marketCap": "37880037109.00000000",
          "liquidMarketCap": "37947633211.50930000",
          "name": "XRP",
          "rank": 7,
          "symbol": "xrp",
          "circulatingSupply": "48135209660.00000000",
          "totalSupply": "100000000000.00000000",
          "maxSupply": "100000000000.00000000",
          "tokenVelocity": null,
          "transactionVolume": null,
          "uniqueAddresses": null,
          "tradeVolume": "2928703030",
          "specifications": [],
          "blockchain": {
            "name": "XRP",
            "slug": "xrp",
            "symbol": "xrp",
            "blockchainId": "2b8a5d8975e8c2a2ed92450450979a3c",
            "icon": "https://amberdata.io/digital-assets/xrp_xrp.png"
          }
        },
        {
          "address": "0xd2877702675e6ceb975b4a1dff9fb7baf4c91ea9",
          "changeInPrice": "8.74493515",
          "changeInPriceHourly": "1.38542523",
          "changeInPriceDaily": "8.74493515",
          "changeInPriceWeekly": "1.41334343",
          "currentPrice": "106.74",
          "decimals": "18",
          "marketCap": "37511889769.00000000",
          "liquidMarketCap": "37554811439.98534110",
          "name": "Terra",
          "rank": 8,
          "symbol": "luna",
          "circulatingSupply": "351834471.05101500",
          "totalSupply": "748541751.83221500",
          "maxSupply": "1000000000.00000000",
          "tokenVelocity": "0.000000542152928310669980",
          "transactionVolume": "85",
          "uniqueAddresses": "273",
          "tradeVolume": "3221651369",
          "specifications": [],
          "blockchain": {
            "name": "Terra",
            "slug": "terra",
            "symbol": "luna",
            "blockchainId": "e2d6dda47620d8afd18fd4a8095d786e",
            "icon": "https://amberdata.io/digital-assets/terra_luna.png"
          }
        },
        {
          "address": null,
          "changeInPrice": "0.89414458",
          "changeInPriceHourly": "0.56553995",
          "changeInPriceDaily": "0.89414458",
          "changeInPriceWeekly": "21.48869873",
          "currentPrice": "1.094",
          "decimals": null,
          "marketCap": "34989147995.00000000",
          "liquidMarketCap": "35080631391.24436900",
          "name": "Cardano",
          "rank": 9,
          "symbol": "ada",
          "circulatingSupply": "32066390668.41350000",
          "totalSupply": "45000000000.00000000",
          "maxSupply": "45000000000.00000000",
          "tokenVelocity": null,
          "transactionVolume": null,
          "uniqueAddresses": null,
          "tradeVolume": "1507188685",
          "specifications": [],
          "blockchain": {
            "name": "Cardano",
            "slug": "cardano",
            "symbol": "ada",
            "blockchainId": "86f18d080f2d95bed3cb290a028ceb77",
            "icon": "https://amberdata.io/digital-assets/cardano_ada.png"
          }
        },
        {
          "address": null,
          "changeInPrice": "2.02221132",
          "changeInPriceHourly": "0.18748544",
          "changeInPriceDaily": "2.02221132",
          "changeInPriceWeekly": "3.59041192",
          "currentPrice": "85.81",
          "decimals": null,
          "marketCap": "22916170401.00000000",
          "liquidMarketCap": "22995945071.07085343",
          "name": "Avalanche",
          "rank": 10,
          "symbol": "avax",
          "circulatingSupply": "267986773.93160300",
          "totalSupply": "377752194.46954830",
          "maxSupply": "720000000.00000000",
          "tokenVelocity": null,
          "transactionVolume": null,
          "uniqueAddresses": null,
          "tradeVolume": "1469671189",
          "specifications": [],
          "blockchain": {
            "name": "Avalanche",
            "slug": "avalanche",
            "symbol": "avax",
            "blockchainId": "821f3a485e00987c6051bd0b31a971d0",
            "icon": "https://amberdata.io/digital-assets/avalanche_avax.png"
          }
        },
        {
          "address": null,
          "changeInPrice": "0.89882695",
          "changeInPriceHourly": "-0.23093464",
          "changeInPriceDaily": "0.89882695",
          "changeInPriceWeekly": "14.65635541",
          "currentPrice": "20.46",
          "decimals": null,
          "marketCap": "22470002957.00000000",
          "liquidMarketCap": "22514091143.21806560",
          "name": "Polkadot",
          "rank": 11,
          "symbol": "dot",
          "circulatingSupply": "1100395461.54536000",
          "totalSupply": "1181344594.45176000",
          "maxSupply": "0.00000000",
          "tokenVelocity": null,
          "transactionVolume": null,
          "uniqueAddresses": null,
          "tradeVolume": "919155271",
          "specifications": [],
          "blockchain": {
            "name": "Polkadot",
            "slug": "polkadot",
            "symbol": "dot",
            "blockchainId": "d3f514a34614d4b25075a7b6c5135282",
            "icon": "https://amberdata.io/digital-assets/polkadot_dot.png"
          }
        },
        {
          "address": null,
          "changeInPrice": "0.48684360",
          "changeInPriceHourly": "0.45922638",
          "changeInPriceDaily": "0.48684360",
          "changeInPriceWeekly": "16.21765798",
          "currentPrice": "0.147431",
          "decimals": null,
          "marketCap": "19522909029.00000000",
          "liquidMarketCap": "19559783451.49767231",
          "name": "Dogecoin",
          "rank": 12,
          "symbol": "doge",
          "circulatingSupply": "132670764299.89400000",
          "totalSupply": "0.00000000",
          "maxSupply": "0.00000000",
          "tokenVelocity": null,
          "transactionVolume": null,
          "uniqueAddresses": null,
          "tradeVolume": "2172333620",
          "specifications": [],
          "blockchain": {
            "name": "Dogecoin",
            "slug": "dogecoin",
            "symbol": "doge",
            "blockchainId": "c04cc70179c97c5a00e50ea87069e20c",
            "icon": "https://amberdata.io/digital-assets/dogecoin_doge.png"
          }
        },
        {
          "address": "0x4fabb145d64652a948d72533023f6e7a623c7c53",
          "changeInPrice": "0.03658768",
          "changeInPriceHourly": "-0.02000781",
          "changeInPriceDaily": "0.03658768",
          "changeInPriceWeekly": "-0.00709038",
          "currentPrice": "1.001",
          "decimals": "18",
          "marketCap": "17737924537.00000000",
          "liquidMarketCap": "17747360425.06427000",
          "name": "Binance USD",
          "rank": 13,
          "symbol": "busd",
          "circulatingSupply": "17729630794.27000000",
          "totalSupply": "17729630794.27000000",
          "maxSupply": "0.00000000",
          "tokenVelocity": "0.000000046581547380650317",
          "transactionVolume": "260",
          "uniqueAddresses": "579",
          "tradeVolume": "5819995187",
          "specifications": [],
          "blockchain": {
            "name": "Binance USD",
            "slug": "binance usd",
            "symbol": "busd",
            "blockchainId": "c7287e79e7e5f0bedd9c90d358321f21",
            "icon": "https://amberdata.io/digital-assets/binanceusd_busd.png"
          }
        },
        {
          "address": "0xa47c8bf37f92abed4a126bda807a7b7498661acd",
          "changeInPrice": "-0.00922011",
          "changeInPriceHourly": "0.02581056",
          "changeInPriceDaily": "-0.00922011",
          "changeInPriceWeekly": "-0.27429978",
          "currentPrice": "1.002",
          "decimals": "18",
          "marketCap": "16739945541.00000000",
          "liquidMarketCap": "16755727357.39171620",
          "name": "TerraUSD",
          "rank": 14,
          "symbol": "ust",
          "circulatingSupply": "16722282791.80810000",
          "totalSupply": "16722273124.45560000",
          "maxSupply": "0.00000000",
          "tokenVelocity": "0.000000108362616390220432",
          "transactionVolume": "325",
          "uniqueAddresses": "947",
          "tradeVolume": "1182666021",
          "specifications": [],
          "blockchain": {
            "name": "TerraUSD",
            "slug": "terrausd",
            "symbol": "ust",
            "blockchainId": "cd50729713338ca732838ab7a4d25ea6",
            "icon": "https://amberdata.io/digital-assets/terrausd_ust.png"
          }
        },
        {
          "address": "0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce",
          "changeInPrice": "0.19242182",
          "changeInPriceHourly": "0.99903347",
          "changeInPriceDaily": "0.19242182",
          "changeInPriceWeekly": "13.38414896",
          "currentPrice": "0.0000251",
          "decimals": "18",
          "marketCap": "13775149324.00000000",
          "liquidMarketCap": "13783589381.61918554",
          "name": "Shiba Inu",
          "rank": 15,
          "symbol": "shib",
          "circulatingSupply": "549146987315505.40000000",
          "totalSupply": "1000000000000000.00000000",
          "maxSupply": "0.00000000",
          "tokenVelocity": "0.0000000000049630000000000000",
          "transactionVolume": "1570",
          "uniqueAddresses": "3058",
          "tradeVolume": "1055389536",
          "specifications": [],
          "blockchain": {
            "name": "Shiba Inu",
            "slug": "shiba inu",
            "symbol": "shib",
            "blockchainId": "b116c567ea87480b57d9e7890f1e4785",
            "icon": "https://amberdata.io/digital-assets/shibainu_shib.png"
          }
        },
        {
          "address": "0x88c7385a403008b63dc028ba5acbad3edb1d1fa9",
          "changeInPrice": "0.41236619",
          "changeInPriceHourly": "0.10531758",
          "changeInPriceDaily": "0.41236619",
          "changeInPriceWeekly": "12.85571994",
          "currentPrice": "43792",
          "decimals": "18",
          "marketCap": "12053554369.00000000",
          "liquidMarketCap": "12052870674.92306848",
          "name": "Wrapped Bitcoin",
          "rank": 16,
          "symbol": "wbtc",
          "circulatingSupply": "275229.96608794",
          "totalSupply": "275229.96608794",
          "maxSupply": "275229.96608794",
          "tokenVelocity": null,
          "transactionVolume": null,
          "uniqueAddresses": null,
          "tradeVolume": "300297680",
          "specifications": [],
          "blockchain": {
            "name": "Wrapped Bitcoin",
            "slug": "wrapped bitcoin",
            "symbol": "wbtc",
            "blockchainId": "2a3ca974ff40dd1b1026321b52e6e747",
            "icon": "https://amberdata.io/digital-assets/wrappedbitcoin_wbtc.png"
          }
        },
        {
          "address": "0xa0b73e1ff0b80914ab6fe0444e65848c4c34450b",
          "changeInPrice": "0.18051506",
          "changeInPriceHourly": "-0.41204745",
          "changeInPriceDaily": "0.18051506",
          "changeInPriceWeekly": "15.78072230",
          "currentPrice": "0.450158",
          "decimals": "8",
          "marketCap": "11355531590.00000000",
          "liquidMarketCap": "11372347717.56333600",
          "name": "Cronos",
          "rank": 17,
          "symbol": "cro",
          "circulatingSupply": "25263013692.00000000",
          "totalSupply": "30263013692.00000000",
          "maxSupply": "0.00000000",
          "tokenVelocity": "0.000000064765525996445100",
          "transactionVolume": "648",
          "uniqueAddresses": "1049",
          "tradeVolume": "87943852",
          "specifications": [],
          "blockchain": {
            "name": "Cronos",
            "slug": "cronos",
            "symbol": "cro",
            "blockchainId": "92b2abe0edee2c4f84f580bbaaac6d3e"
          }
        },
...
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
  },
  "debug": {
    "cacheKey": "d+mryffHVHFglQb9/p/ZBZsow6c="
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

MIT License
