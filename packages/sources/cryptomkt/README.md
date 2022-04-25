# Chainlink External Adapter for CryptoMKT

![1.2.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptomkt/package.json)

Base URL https://api.exchange.cryptomkt.com/api/3/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                   Default                   |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://api.exchange.cryptomkt.com/api/3/` |

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

| Required? | Name  |        Aliases         |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `fsym` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote | `market`, `to`, `tsym` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "resultPath": "last",
    "base": "BTC",
    "quote": "ARS"
  },
  "debug": {
    "cacheKey": "CcS8zsdvjPOtcrwvJC+eqUSZheg="
  },
  "rateLimitMaxAge": 6666
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "ask": "12395990",
    "bid": "12339900",
    "last": "12396935",
    "low": "11716731",
    "high": "12403061",
    "open": "11845809",
    "volume": "1.62057",
    "volume_quote": "19483671.75328",
    "timestamp": "2021-11-25T16:27:54.000Z",
    "result": 12396935
  },
  "result": 12396935,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
