# Chainlink External Adapter for CoinCodex

Version: 1.2.1

Price adapter to query the price of an asset in USD. Only USD is supported by CoinCodex as a quote currency.

## Environment Variables

There are no environment variables for this adapter.

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
|    ✅     | base | `from`, `coin` | The symbol of the currency to query | string |         |         |            |                |

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
  "result": 4533.8640179546355
}
```
