# Chainlink External Adapter for cryptoID

Version: 1.2.23

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                           Options                            |   Default    |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [difficulty](#bc_info-endpoint), [height](#bc_info-endpoint) | `difficulty` |

---

## Bc_info Endpoint

Supported names for this endpoint are: `difficulty`, `height`.

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
  "jobRunID": "1",
  "data": {
    "result": 22674148233453.1
  },
  "result": 22674148233453.1,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
