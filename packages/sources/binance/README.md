# Chainlink External Adapter for Binance

Version: 1.2.23

Adapter using the public Binance market API for both HTTP(s) and WS.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       | Description |  Type  | Options |              Default               |
| :-------: | :-------------: | :---------: | :----: | :-----: | :--------------------------------: |
|           |  API_ENDPOINT   |             | string |         |     `https://api.binance.com`      |
|           | WS_API_ENDPOINT |             | string |         | `wss://stream.binance.com:9443/ws` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                        Options                         | Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint), [ticker](#crypto-endpoint) | `crypto` |

---

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
