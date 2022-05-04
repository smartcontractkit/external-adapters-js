# Chainlink External Adapter for Binance

![1.2.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/binance/package.json)

Adapter using the public Binance market API for both HTTP(s) and WS.

Base URL https://api.binance.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       | Description |  Type  | Options |              Default               |
| :-------: | :-------------: | :---------: | :----: | :-----: | :--------------------------------: |
|           |  API_ENDPOINT   |             | string |         |     `https://api.binance.com`      |
|           | WS_API_ENDPOINT |             | string |         | `wss://stream.binance.com:9443/ws` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [ticker](#crypto-endpoint) | `crypto` |

## Crypto Endpoint

**Note: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.**

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
    "base": "ETH",
    "quote": "BTC"
  },
  "debug": {
    "cacheKey": "Eao0YPhZDa3+RmRxiwOG5dAIIt0="
  },
  "rateLimitMaxAge": 55
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "symbol": "ETHBTC",
    "price": "0.07077300",
    "result": 0.070773
  },
  "result": 0.070773,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---

MIT License
