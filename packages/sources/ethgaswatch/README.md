# Chainlink External Adapter for EthGasWatch

![1.2.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ethgaswatch/package.json)

Base URL https://ethgas.watch

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |        Default         |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------: |
|           | API_ENDPOINT |             | string |         | `https://ethgas.watch` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [gasprice](#gasprice-endpoint) | `gasprice` |

## Gasprice Endpoint

`gasprice` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |    Description    |  Type  |               Options               | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :---------------: | :----: | :---------------------------------: | :-----: | :--------: | :------------: |
|           | speed |         | The desired speed | string | `fast`, `instant`, `normal`, `slow` | `fast`  |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "gasprice",
    "speed": "fast"
  },
  "debug": {
    "cacheKey": "0BJQ6WrEaARtjkqLfBrRVKG+QcE="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "slow": {
      "gwei": 141,
      "usd": 13.42
    },
    "normal": {
      "gwei": 148,
      "usd": 14.09
    },
    "fast": {
      "gwei": 170,
      "usd": 16.18
    },
    "instant": {
      "gwei": 192,
      "usd": 18.28
    },
    "ethPrice": 4533.01,
    "lastUpdated": 1637862962320,
    "sources": [
      {
        "name": "Etherscan",
        "source": "https://etherscan.io/gastracker",
        "fast": 145,
        "standard": 144,
        "slow": 144,
        "lastBlock": 13684916
      },
      {
        "name": "Gas station",
        "source": "https://ethgasstation.info/",
        "instant": 183,
        "fast": 172,
        "standard": 148,
        "slow": 132,
        "lastBlock": 13684915
      },
      {
        "name": "MyCrypto",
        "source": "https://gas.mycryptoapi.com/",
        "instant": 208,
        "fast": 168,
        "standard": 148,
        "slow": 138,
        "lastBlock": 13684915
      },
      {
        "name": "POA Network",
        "source": "https://gasprice.poa.network/",
        "instant": null,
        "fast": 152,
        "standard": null,
        "slow": 127,
        "lastBlock": null
      },
      {
        "name": "Upvest",
        "source": "https://doc.upvest.co/reference#ethereum-fees",
        "instant": 192,
        "fast": 192,
        "standard": 166,
        "slow": 162,
        "lastUpdate": 1637862962296
      }
    ],
    "result": 170
  },
  "result": 170,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
