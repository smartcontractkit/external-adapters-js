# CRYPTOCOMPARE

![2.0.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptocompare/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |                              Description                              |  Type   | Options |                Default                |
| :-------: | :-------------: | :-------------------------------------------------------------------: | :-----: | :-----: | :-----------------------------------: |
|           |  API_ENDPOINT   |                  The HTTP URL to retrieve data from                   | string  |         |  `https://min-api.cryptocompare.com`  |
|           | WS_API_ENDPOINT |                   The WS URL to retrieve data from                    | string  |         | `wss://streamer.cryptocompare.com/v2` |
|    ✅     |     API_KEY     |                       The CryptoCompare API key                       | string  |         |                                       |
|           |   WS_API_KEY    | The websocket API key to authenticate with, if different from API_KEY | string  |         |                                       |
|           |   WS_ENABLED    |         Whether data should be returned from websocket or not         | boolean |         |                `false`                |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                                                                  Options                                                                                   | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto-vwap](#vwap-endpoint), [crypto](#crypto-endpoint), [marketcap](#marketcap-endpoint), [price](#crypto-endpoint), [volume](#volume-endpoint), [vwap](#vwap-endpoint) | `crypto` |

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? | Name  |        Aliases         |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `fsym` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to`, `tsym` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "BTC",
    "endpoint": "crypto",
    "resultPath": "PRICE"
  },
  "debug": {
    "cacheKey": "Eao0YPhZDa3+RmRxiwOG5dAIIt0=",
    "batchCacheKey": "6G4SrlsKUEN/0QigWvu9oEaSELA=",
    "batchChildrenCacheKeys": [
      [
        "Eao0YPhZDa3+RmRxiwOG5dAIIt0=",
        {
          "id": "1",
          "data": {
            "base": "ETH",
            "quote": "BTC",
            "endpoint": "crypto",
            "resultPath": "PRICE"
          }
        }
      ]
    ]
  },
  "rateLimitMaxAge": 29201
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "RAW": {
      "ETH": {
        "BTC": {
          "TYPE": "5",
          "MARKET": "CCCAGG",
          "FROMSYMBOL": "ETH",
          "TOSYMBOL": "BTC",
          "FLAGS": "2052",
          "PRICE": 0.06543,
          "LASTUPDATE": 1634917845,
          "MEDIAN": 0.06541,
          "LASTVOLUME": 0.3667,
          "LASTVOLUMETO": 0.0239964813,
          "LASTTRADEID": "266555634",
          "VOLUMEDAY": 426154.9210721772,
          "VOLUMEDAYTO": 44337.6725074485,
          "VOLUME24HOUR": 199268.35105042686,
          "VOLUME24HOURTO": 12999.111610148046,
          "OPENDAY": 0.06516,
          "HIGHDAY": 0.06595,
          "LOWDAY": 0.06486,
          "OPEN24HOUR": 0.06492,
          "HIGH24HOUR": 0.06595,
          "LOW24HOUR": 0.06438,
          "LASTMARKET": "Binance",
          "VOLUMEHOUR": 21826.54200988967,
          "VOLUMEHOURTO": 1662.8001349818653,
          "OPENHOUR": 0.06539,
          "HIGHHOUR": 0.06563,
          "LOWHOUR": 0.06531,
          "TOPTIERVOLUME24HOUR": 196133.9280134269,
          "TOPTIERVOLUME24HOURTO": 12794.391640956886,
          "CHANGE24HOUR": 0.0005099999999999966,
          "CHANGEPCT24HOUR": 0.7855822550831739,
          "CHANGEDAY": 0.00027000000000000635,
          "CHANGEPCTDAY": 0.41436464088398767,
          "CHANGEHOUR": 0.00003999999999999837,
          "CHANGEPCTHOUR": 0.06117143294081415,
          "CONVERSIONTYPE": "direct",
          "CONVERSIONSYMBOL": "",
          "SUPPLY": 117601698.8115,
          "MKTCAP": 7694679.153236445,
          "MKTCAPPENALTY": 0,
          "CIRCULATINGSUPPLY": 117601698.8115,
          "CIRCULATINGSUPPLYMKTCAP": 7694679.153236445,
          "TOTALVOLUME24H": 2239758.9103871463,
          "TOTALVOLUME24HTO": 146508.4089075496,
          "TOTALTOPTIERVOLUME24H": 2231978.1419115765,
          "TOTALTOPTIERVOLUME24HTO": 145999.6785563128,
          "IMAGEURL": "/media/37746238/eth.png"
        }
      }
    },
    "DISPLAY": {
      "ETH": {
        "BTC": {
          "FROMSYMBOL": "Ξ",
          "TOSYMBOL": "Ƀ",
          "MARKET": "CryptoCompare Index",
          "PRICE": "Ƀ 0.06543",
          "LASTUPDATE": "Just now",
          "LASTVOLUME": "Ξ 0.3667",
          "LASTVOLUMETO": "Ƀ 0.02400",
          "LASTTRADEID": "266555634",
          "VOLUMEDAY": "Ξ 426,154.9",
          "VOLUMEDAYTO": "Ƀ 44,337.7",
          "VOLUME24HOUR": "Ξ 199,268.4",
          "VOLUME24HOURTO": "Ƀ 12,999.1",
          "OPENDAY": "Ƀ 0.06516",
          "HIGHDAY": "Ƀ 0.06595",
          "LOWDAY": "Ƀ 0.06486",
          "OPEN24HOUR": "Ƀ 0.06492",
          "HIGH24HOUR": "Ƀ 0.06595",
          "LOW24HOUR": "Ƀ 0.06438",
          "LASTMARKET": "Binance",
          "VOLUMEHOUR": "Ξ 21,826.5",
          "VOLUMEHOURTO": "Ƀ 1,662.80",
          "OPENHOUR": "Ƀ 0.06539",
          "HIGHHOUR": "Ƀ 0.06563",
          "LOWHOUR": "Ƀ 0.06531",
          "TOPTIERVOLUME24HOUR": "Ξ 196,133.9",
          "TOPTIERVOLUME24HOURTO": "Ƀ 12,794.4",
          "CHANGE24HOUR": "Ƀ 0.00051",
          "CHANGEPCT24HOUR": "0.79",
          "CHANGEDAY": "Ƀ 0.00027",
          "CHANGEPCTDAY": "0.41",
          "CHANGEHOUR": "Ƀ 0.000040",
          "CHANGEPCTHOUR": "0.06",
          "CONVERSIONTYPE": "direct",
          "CONVERSIONSYMBOL": "",
          "SUPPLY": "Ξ 117,601,698.8",
          "MKTCAP": "Ƀ 7.69 M",
          "MKTCAPPENALTY": "0 %",
          "CIRCULATINGSUPPLY": "Ξ 117,601,698.8",
          "CIRCULATINGSUPPLYMKTCAP": "Ƀ 7.69 M",
          "TOTALVOLUME24H": "Ξ 2.24 M",
          "TOTALVOLUME24HTO": "Ƀ 146.51 K",
          "TOTALTOPTIERVOLUME24H": "Ξ 2.23 M",
          "TOTALTOPTIERVOLUME24HTO": "Ƀ 146.00 K",
          "IMAGEURL": "/media/37746238/eth.png"
        }
      }
    },
    "result": 0.06543
  },
  "result": 0.06543,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base",
        "limit": 200
      },
      {
        "name": "quote",
        "limit": 20
      }
    ]
  },
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "BTC",
    "endpoint": "marketcap",
    "resultPath": "MKTCAP"
  },
  "debug": {
    "cacheKey": "KbqgFjuDtvts/CAPorCDKS6azZ0=",
    "batchCacheKey": "jn4lMO3NoQk/anX1RCCPMCMFBRU=",
    "batchChildrenCacheKeys": [
      [
        "KbqgFjuDtvts/CAPorCDKS6azZ0=",
        {
          "id": "1",
          "data": {
            "base": "ETH",
            "quote": "BTC",
            "endpoint": "marketcap",
            "resultPath": "MKTCAP"
          }
        }
      ]
    ]
  },
  "rateLimitMaxAge": 58402
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "RAW": {
      "ETH": {
        "BTC": {
          "TYPE": "5",
          "MARKET": "CCCAGG",
          "FROMSYMBOL": "ETH",
          "TOSYMBOL": "BTC",
          "FLAGS": "2052",
          "PRICE": 0.06543,
          "LASTUPDATE": 1634917845,
          "MEDIAN": 0.06541,
          "LASTVOLUME": 0.3667,
          "LASTVOLUMETO": 0.0239964813,
          "LASTTRADEID": "266555634",
          "VOLUMEDAY": 426154.9210721772,
          "VOLUMEDAYTO": 44337.6725074485,
          "VOLUME24HOUR": 199268.35105042686,
          "VOLUME24HOURTO": 12999.111610148046,
          "OPENDAY": 0.06516,
          "HIGHDAY": 0.06595,
          "LOWDAY": 0.06486,
          "OPEN24HOUR": 0.06492,
          "HIGH24HOUR": 0.06595,
          "LOW24HOUR": 0.06438,
          "LASTMARKET": "Binance",
          "VOLUMEHOUR": 21826.54200988967,
          "VOLUMEHOURTO": 1662.8001349818653,
          "OPENHOUR": 0.06539,
          "HIGHHOUR": 0.06563,
          "LOWHOUR": 0.06531,
          "TOPTIERVOLUME24HOUR": 196133.9280134269,
          "TOPTIERVOLUME24HOURTO": 12794.391640956886,
          "CHANGE24HOUR": 0.0005099999999999966,
          "CHANGEPCT24HOUR": 0.7855822550831739,
          "CHANGEDAY": 0.00027000000000000635,
          "CHANGEPCTDAY": 0.41436464088398767,
          "CHANGEHOUR": 0.00003999999999999837,
          "CHANGEPCTHOUR": 0.06117143294081415,
          "CONVERSIONTYPE": "direct",
          "CONVERSIONSYMBOL": "",
          "SUPPLY": 117601698.8115,
          "MKTCAP": 7694679.153236445,
          "MKTCAPPENALTY": 0,
          "CIRCULATINGSUPPLY": 117601698.8115,
          "CIRCULATINGSUPPLYMKTCAP": 7694679.153236445,
          "TOTALVOLUME24H": 2239758.9103871463,
          "TOTALVOLUME24HTO": 146508.4089075496,
          "TOTALTOPTIERVOLUME24H": 2231978.1419115765,
          "TOTALTOPTIERVOLUME24HTO": 145999.6785563128,
          "IMAGEURL": "/media/37746238/eth.png"
        }
      }
    },
    "DISPLAY": {
      "ETH": {
        "BTC": {
          "FROMSYMBOL": "Ξ",
          "TOSYMBOL": "Ƀ",
          "MARKET": "CryptoCompare Index",
          "PRICE": "Ƀ 0.06543",
          "LASTUPDATE": "Just now",
          "LASTVOLUME": "Ξ 0.3667",
          "LASTVOLUMETO": "Ƀ 0.02400",
          "LASTTRADEID": "266555634",
          "VOLUMEDAY": "Ξ 426,154.9",
          "VOLUMEDAYTO": "Ƀ 44,337.7",
          "VOLUME24HOUR": "Ξ 199,268.4",
          "VOLUME24HOURTO": "Ƀ 12,999.1",
          "OPENDAY": "Ƀ 0.06516",
          "HIGHDAY": "Ƀ 0.06595",
          "LOWDAY": "Ƀ 0.06486",
          "OPEN24HOUR": "Ƀ 0.06492",
          "HIGH24HOUR": "Ƀ 0.06595",
          "LOW24HOUR": "Ƀ 0.06438",
          "LASTMARKET": "Binance",
          "VOLUMEHOUR": "Ξ 21,826.5",
          "VOLUMEHOURTO": "Ƀ 1,662.80",
          "OPENHOUR": "Ƀ 0.06539",
          "HIGHHOUR": "Ƀ 0.06563",
          "LOWHOUR": "Ƀ 0.06531",
          "TOPTIERVOLUME24HOUR": "Ξ 196,133.9",
          "TOPTIERVOLUME24HOURTO": "Ƀ 12,794.4",
          "CHANGE24HOUR": "Ƀ 0.00051",
          "CHANGEPCT24HOUR": "0.79",
          "CHANGEDAY": "Ƀ 0.00027",
          "CHANGEPCTDAY": "0.41",
          "CHANGEHOUR": "Ƀ 0.000040",
          "CHANGEPCTHOUR": "0.06",
          "CONVERSIONTYPE": "direct",
          "CONVERSIONSYMBOL": "",
          "SUPPLY": "Ξ 117,601,698.8",
          "MKTCAP": "Ƀ 7.69 M",
          "MKTCAPPENALTY": "0 %",
          "CIRCULATINGSUPPLY": "Ξ 117,601,698.8",
          "CIRCULATINGSUPPLYMKTCAP": "Ƀ 7.69 M",
          "TOTALVOLUME24H": "Ξ 2.24 M",
          "TOTALVOLUME24HTO": "Ƀ 146.51 K",
          "TOTALTOPTIERVOLUME24H": "Ξ 2.23 M",
          "TOTALTOPTIERVOLUME24HTO": "Ƀ 146.00 K",
          "IMAGEURL": "/media/37746238/eth.png"
        }
      }
    },
    "result": 7694679.153236445
  },
  "result": 7694679.153236445,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base",
        "limit": 200
      },
      {
        "name": "quote",
        "limit": 20
      }
    ]
  },
  "providerStatusCode": 200
}
```

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "BTC",
    "endpoint": "volume",
    "resultPath": "VOLUME24HOURTO"
  },
  "debug": {
    "cacheKey": "b8cVkUXVyDdOe/are/9XZjUuFsw=",
    "batchCacheKey": "7tI8y8sPATDZY9jYxipk1dWrnus=",
    "batchChildrenCacheKeys": [
      [
        "b8cVkUXVyDdOe/are/9XZjUuFsw=",
        {
          "id": "1",
          "data": {
            "base": "ETH",
            "quote": "BTC",
            "endpoint": "volume",
            "resultPath": "VOLUME24HOURTO"
          }
        }
      ]
    ]
  },
  "rateLimitMaxAge": 87604
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "RAW": {
      "ETH": {
        "BTC": {
          "TYPE": "5",
          "MARKET": "CCCAGG",
          "FROMSYMBOL": "ETH",
          "TOSYMBOL": "BTC",
          "FLAGS": "2052",
          "PRICE": 0.06543,
          "LASTUPDATE": 1634917845,
          "MEDIAN": 0.06541,
          "LASTVOLUME": 0.3667,
          "LASTVOLUMETO": 0.0239964813,
          "LASTTRADEID": "266555634",
          "VOLUMEDAY": 426154.9210721772,
          "VOLUMEDAYTO": 44337.6725074485,
          "VOLUME24HOUR": 199268.35105042686,
          "VOLUME24HOURTO": 12999.111610148046,
          "OPENDAY": 0.06516,
          "HIGHDAY": 0.06595,
          "LOWDAY": 0.06486,
          "OPEN24HOUR": 0.06492,
          "HIGH24HOUR": 0.06595,
          "LOW24HOUR": 0.06438,
          "LASTMARKET": "Binance",
          "VOLUMEHOUR": 21826.54200988967,
          "VOLUMEHOURTO": 1662.8001349818653,
          "OPENHOUR": 0.06539,
          "HIGHHOUR": 0.06563,
          "LOWHOUR": 0.06531,
          "TOPTIERVOLUME24HOUR": 196133.9280134269,
          "TOPTIERVOLUME24HOURTO": 12794.391640956886,
          "CHANGE24HOUR": 0.0005099999999999966,
          "CHANGEPCT24HOUR": 0.7855822550831739,
          "CHANGEDAY": 0.00027000000000000635,
          "CHANGEPCTDAY": 0.41436464088398767,
          "CHANGEHOUR": 0.00003999999999999837,
          "CHANGEPCTHOUR": 0.06117143294081415,
          "CONVERSIONTYPE": "direct",
          "CONVERSIONSYMBOL": "",
          "SUPPLY": 117601698.8115,
          "MKTCAP": 7694679.153236445,
          "MKTCAPPENALTY": 0,
          "CIRCULATINGSUPPLY": 117601698.8115,
          "CIRCULATINGSUPPLYMKTCAP": 7694679.153236445,
          "TOTALVOLUME24H": 2239758.9103871463,
          "TOTALVOLUME24HTO": 146508.4089075496,
          "TOTALTOPTIERVOLUME24H": 2231978.1419115765,
          "TOTALTOPTIERVOLUME24HTO": 145999.6785563128,
          "IMAGEURL": "/media/37746238/eth.png"
        }
      }
    },
    "DISPLAY": {
      "ETH": {
        "BTC": {
          "FROMSYMBOL": "Ξ",
          "TOSYMBOL": "Ƀ",
          "MARKET": "CryptoCompare Index",
          "PRICE": "Ƀ 0.06543",
          "LASTUPDATE": "Just now",
          "LASTVOLUME": "Ξ 0.3667",
          "LASTVOLUMETO": "Ƀ 0.02400",
          "LASTTRADEID": "266555634",
          "VOLUMEDAY": "Ξ 426,154.9",
          "VOLUMEDAYTO": "Ƀ 44,337.7",
          "VOLUME24HOUR": "Ξ 199,268.4",
          "VOLUME24HOURTO": "Ƀ 12,999.1",
          "OPENDAY": "Ƀ 0.06516",
          "HIGHDAY": "Ƀ 0.06595",
          "LOWDAY": "Ƀ 0.06486",
          "OPEN24HOUR": "Ƀ 0.06492",
          "HIGH24HOUR": "Ƀ 0.06595",
          "LOW24HOUR": "Ƀ 0.06438",
          "LASTMARKET": "Binance",
          "VOLUMEHOUR": "Ξ 21,826.5",
          "VOLUMEHOURTO": "Ƀ 1,662.80",
          "OPENHOUR": "Ƀ 0.06539",
          "HIGHHOUR": "Ƀ 0.06563",
          "LOWHOUR": "Ƀ 0.06531",
          "TOPTIERVOLUME24HOUR": "Ξ 196,133.9",
          "TOPTIERVOLUME24HOURTO": "Ƀ 12,794.4",
          "CHANGE24HOUR": "Ƀ 0.00051",
          "CHANGEPCT24HOUR": "0.79",
          "CHANGEDAY": "Ƀ 0.00027",
          "CHANGEPCTDAY": "0.41",
          "CHANGEHOUR": "Ƀ 0.000040",
          "CHANGEPCTHOUR": "0.06",
          "CONVERSIONTYPE": "direct",
          "CONVERSIONSYMBOL": "",
          "SUPPLY": "Ξ 117,601,698.8",
          "MKTCAP": "Ƀ 7.69 M",
          "MKTCAPPENALTY": "0 %",
          "CIRCULATINGSUPPLY": "Ξ 117,601,698.8",
          "CIRCULATINGSUPPLYMKTCAP": "Ƀ 7.69 M",
          "TOTALVOLUME24H": "Ξ 2.24 M",
          "TOTALVOLUME24HTO": "Ƀ 146.51 K",
          "TOTALTOPTIERVOLUME24H": "Ξ 2.23 M",
          "TOTALTOPTIERVOLUME24HTO": "Ƀ 146.00 K",
          "IMAGEURL": "/media/37746238/eth.png"
        }
      }
    },
    "result": 12999.111610148046
  },
  "result": 12999.111610148046,
  "statusCode": 200,
  "debug": {
    "batchablePropertyPath": [
      {
        "name": "base",
        "limit": 200
      },
      {
        "name": "quote",
        "limit": 20
      }
    ]
  },
  "providerStatusCode": 200
}
```

</details>

---

## Vwap Endpoint

Supported names for this endpoint are: `crypto-vwap`, `vwap`.

### Input Params

| Required? | Name  |        Aliases         |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `fsym` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to`, `tsym` |    The symbol of the currency to convert to    | string |         |         |            |                |
|           | hours |                        |        Number of hours to get VWAP for         | number |         |  `24`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "AMPL",
    "quote": "USD",
    "hours": 24,
    "endpoint": "vwap"
  },
  "debug": {
    "cacheKey": "ktiYBaPq7+GA3M0Ss87tRIW2Nsw="
  },
  "rateLimitMaxAge": 116805
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "USD": 0.9224,
    "ConversionType": {
      "type": "direct",
      "conversionSymbol": ""
    },
    "result": 0.9224
  },
  "result": 0.9224,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

## Volume Endpoint

`volume` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |        Aliases         |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `fsym` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to`, `tsym` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

## Marketcap Endpoint

`marketcap` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |        Aliases         |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `fsym` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `to`, `tsym` |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
