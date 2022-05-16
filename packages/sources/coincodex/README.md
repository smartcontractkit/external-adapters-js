# Chainlink External Adapter for CoinCodex

![1.2.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coincodex/package.json)

Price adapter to query the price of an asset in USD. Only USD is supported by CoinCodex as a quote currency.

Base URL https://coincodex.com/api/coincodex/

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                Default                 |
| :-------: | :----------: | :---------: | :----: | :-----: | :------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://coincodex.com/api/coincodex/` |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [getcoin](#getcoin-endpoint) | `getcoin` |

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
  },
  "debug": {
    "cacheKey": "6fb77e7265859558a11c0d4e7de704cb1de254c0"
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

MIT License
