# Chainlink External Adapter for Coinbase

Version: 1.2.1

Query information from [Coinbase's API](https://developers.coinbase.com/api/v2)

##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

Supported names for this endpoint are: `crypto`, `price`.

### Input Params

| Required? |  Name   |            Aliases            |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :---------------------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol  | `base`, `from`, `coin`, `sym` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | convert |    `quote`, `to`, `market`    | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "symbol": "BTC",
    "convert": "USD"
  },
  "rateLimitMaxAge": 370
}
```

Response:

```json
{
  "data": {
    "base": "BTC",
    "currency": "USD",
    "amount": "57854.29"
  },
  "result": 57854.29
}
```
