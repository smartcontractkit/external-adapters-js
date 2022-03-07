# Chainlink External Adapter for XBTO

Version: 1.2.17

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options | Default |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT |             |        |         |         |
|    ✅     |   API_KEY    |             | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

---

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases | Description |  Type  |    Options     | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :---------: | :----: | :------------: | :-----: | :--------: | :------------: |
|           | market |         |             | string | `brent`, `wti` | `brent` |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "market": "brent"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 83.86309
  },
  "result": 83.86309,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "price",
    "market": "wti"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 82.5261
  },
  "result": 82.5261,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

</details>

---
