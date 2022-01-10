# Chainlink External Adapter for CryptoMKT

Version: 1.2.1

##### NOTE: the `ticker` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `ticker`.

### Input Params

| Required? |    Name    |        Aliases         |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :--------------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `from`, `coin`, `fsym` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     |   quote    | `to`, `market`, `tsym` | The symbol of the currency to convert to | string |         |         |            |                |
|           | resultPath |                        |         The path for the result          | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "base": "BTC",
    "quote": "ARS",
    "resultPath": "last"
  },
  "rateLimitMaxAge": 6666
}
```

Response:

```json
{
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
}
```
