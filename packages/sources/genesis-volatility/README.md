# Chainlink External Adapter for Genesis Volatility

Version: 1.2.23

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |             Description             |  Type  | Options |              Default              |
| :-------: | :----------: | :---------------------------------: | :----: | :-----: | :-------------------------------: |
|    ✅     |   API_KEY    | Your API key for Genesis Volatility | string |         |                                   |
|           | API_ENDPOINT |                                     | string |         | `https://app.pinkswantrading.com` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [volatility](#volatility-endpoint) | `volatility` |

---

## Volatility Endpoint

`volatility` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |          Aliases          |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----------------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |  `base`, `coin`, `from`   | The symbol of the currency to query | string |         |         |            |                |
|    ✅     |  days  | `key`, `period`, `result` |   The key to get the result from    | number |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "coin": "ETH",
    "days": 1
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 89.31
  },
  "result": 89.31,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
