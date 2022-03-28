# Chainlink External Adapter for Deribit

Version: 1.1.23

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                 Default                  |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://www.deribit.com/api/v2/public/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

---

## Crypto Endpoint

`crypto` is the only supported name for this endpoint.

### Input Params

| Required? |   Name   |             Aliases              |             Description             | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :------------------------------: | :---------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | currency | `base`, `coin`, `from`, `symbol` | The symbol of the currency to query |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "crypto",
    "currency": "ETH"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 68.16959232733399
  },
  "result": 68.16959232733399,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
