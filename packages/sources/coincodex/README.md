# Chainlink External Adapter for CoinCodex

Version: 1.2.23

Price adapter to query the price of an asset in USD. Only USD is supported by CoinCodex as a quote currency.

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                Default                 |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://coincodex.com/api/coincodex/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [getcoin](#getcoin-endpoint) | `getcoin` |

---

## Getcoin Endpoint

`getcoin` is the only supported name for this endpoint.

### Input Params

| Required? | Name |    Aliases     |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from` | The symbol of the currency to query | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 4533.8640179546355
  },
  "result": 4533.8640179546355,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
