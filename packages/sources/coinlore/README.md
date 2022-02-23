# Chainlink External Adapter for Coin Lore

Version: 1.2.16

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
  "result": 19.25
}
```

---
