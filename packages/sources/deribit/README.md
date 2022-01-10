# @chainlink/deribit-adapter env var schema

Version: 1.1.1

## Environment Variables

There are no environment variables for this adapter.

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
|    ✅     | currency | `base`, `from`, `coin`, `symbol` | The symbol of the currency to query |      |         |         |            |                |

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
  "result": 68.16959232733399
}
```
