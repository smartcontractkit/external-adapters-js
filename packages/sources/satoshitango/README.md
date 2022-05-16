# Chainlink External Adapter for SatoshiTango

![1.2.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/satoshitango/package.json)

Base URL https://api.satoshitango.com/v3

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |              Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://api.satoshitango.com/v3` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [ticker](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

**NOTE: the `ticker` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

Supported names for this endpoint are: `crypto`, `ticker`.

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
    "resultPath": "bid",
    "base": "BTC",
    "quote": "ARS"
  },
  "debug": {
    "cacheKey": "HuvixubrAxBvY45+06PCegj+ouA="
  },
  "rateLimitMaxAge": 16666
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "ticker": {
        "BTC": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 11161854.6,
          "ask": 11724743.65,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "ETH": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 898714.07,
          "ask": 945231.42,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "LTC": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 40837.06,
          "ask": 42890.6,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "XRP": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 194.94,
          "ask": 204.69,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "BCH": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 112124.88,
          "ask": 117602.72,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "ADA": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 307.75,
          "ask": 322.81,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "DOGE": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 42.28,
          "ask": 44.38,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "LINK": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 5058.71,
          "ask": 5308.5,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "UNI": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 4060.62,
          "ask": 4267.95,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "XLM": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 66.73,
          "ask": 70.08,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "SOL": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 41136.32,
          "ask": 43275.96,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "DOT": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 7356.24,
          "ask": 7717.83,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "DAI": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 195.43,
          "ask": 205.18,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "USDC": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 195.48,
          "ask": 205.09,
          "high": 0,
          "low": 0,
          "volume": 0
        },
        "USDT": {
          "date": "2021-11-30 16:23:04",
          "timestamp": 1638289384,
          "bid": 195.66,
          "ask": 205.27,
          "high": 0,
          "low": 0,
          "volume": 0
        }
      },
      "code": "success"
    },
    "result": 11161854.6
  },
  "result": 11161854.6,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
