# Chainlink External Adapter for Coin Lore

Version: 1.2.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                            Options                                             |   Default   |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | string | [dominance](#global-endpoint), [global](#global-endpoint), [globalmarketcap](#global-endpoint) | `dominance` |

---

## Global Endpoint

Supported names for this endpoint are: `dominance`, `global`, `globalmarketcap`.

### Input Params

| Required? |   Name   | Aliases |                                  Description                                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :-----: | :----------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           |   base   |         | When using a field of `d`, the currency to prefix the field with (e.g. `usd_d` | string |         |  `btc`  |            |                |
|           | endpoint |         |                          The adapter endpoint to use                           | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "global",
    "resultPath": "d",
    "base": "eth"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "payload": [
      {
        "coins_count": 6441,
        "active_markets": 17685,
        "total_mcap": 2499568847643.1787,
        "total_volume": 172809052616.55072,
        "btc_d": "43.86",
        "eth_d": "19.25",
        "mcap_change": "-4.25",
        "volume_change": "8.44",
        "avg_change_percent": "-0.90",
        "volume_ath": 3992741953593.4854,
        "mcap_ath": 2912593726674.3335
      }
    ],
    "result": 19.25
  },
  "result": 19.25,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
