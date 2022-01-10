# Chainlink External Adapter for cryptoID

Version: 1.2.1

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [bc_info](#bc_info-endpoint) | `difficulty` |

---

## Bc_info Endpoint

Supported names for this endpoint are: `height`, `difficulty`.

### Input Params

| Required? |    Name    | Aliases |         Description         |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :-------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | blockchain | `coin`  |    The blockchain name.     | string |         |         |            |                |
|           |  endpoint  |         | Name of the endpoint to use | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "coin": "BTC"
  }
}
```

Response:

```json
{
  "result": 22674148233453.1
}
```
