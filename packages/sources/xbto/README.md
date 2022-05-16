# Chainlink External Adapter for XBTO

![1.2.34](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/xbto/package.json)

Base URL https://fpiw7f0axc.execute-api.us-east-1.amazonaws.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options | Default |
| :-------: | :----------: | :---------: | :----: | :-----: | :-----: |
|           | API_ENDPOINT |             |        |         |         |
|    ✅     |   API_KEY    |             | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

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
  },
  "debug": {
    "cacheKey": "kOklXsmmSkKwHHQ7Y3UJdk26rC8="
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
  },
  "debug": {
    "cacheKey": "ZFIDg0FVXiArti9zMRWkbguidY8="
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

MIT License
