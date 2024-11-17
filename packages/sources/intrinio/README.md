# INTRINIO

![2.0.24](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/intrinio/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |       Description        |  Type  | Options |            Default             |
| :-------: | :----------: | :----------------------: | :----: | :-----: | :----------------------------: |
|           | API_ENDPOINT | The API url for intrinio | string |         | `https://api-v2.intrinio.com/` |
|           |   API_KEY    | The API key for intrinio | string |         |                                |

---

## Data Provider Rate Limits

|   Name    | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-------: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
|  bronze   |                             |             300             |                           |      |
| chainlink |                             |             600             |                           |      |
|  silver   |                             |            2000             |                           |      |
|   gold    |                             |            2000             |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint), [stock](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `price`, `stock`.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "AAPL"
  }
}
```

---

MIT License
