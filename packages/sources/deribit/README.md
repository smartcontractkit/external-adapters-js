# Chainlink External Adapter for Deribit

![1.1.31](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/deribit/package.json)

Base URL https://www.deribit.com/api/v2/public/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                 Default                  |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://www.deribit.com/api/v2/public/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#crypto-endpoint) | `crypto` |

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
  },
  "debug": {
    "cacheKey": "hJ7N538OT46zUTHH59trC5Qbouw="
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

MIT License
