# @chainlink/genesis-volatility-adapter env var schema

Version: 1.2.1

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |              Default              |
| :-------: | :----------: | :---------: | :----: | :-----: | :-------------------------------: |
|    ✅     |   API_KEY    |             | string |         |                                   |
|           | API_ENDPOINT |             | string |         | `https://app.pinkswantrading.com` |

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
|    ✅     | symbol |  `base`, `from`, `coin`   | The symbol of the currency to query | string |         |         |            |                |
|    ✅     |  days  | `period`, `result`, `key` |   The key to get the result from    | number |         |         |            |                |

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
  "result": 89.31
}
```
