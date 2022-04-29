# Chainlink External Adapter for cryptoID

![1.2.30](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/cryptoid/package.json)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   | Description |  Type  | Options | Default |
| :-------: | :-----: | :---------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY |             | string |         |         |

---

## Input Parameters

Every EA supports base input parameters from [this list](../../core/bootstrap#base-input-parameters)

| Required? |   Name   |     Description     |  Type  |                           Options                            |   Default    |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [difficulty](#bc_info-endpoint), [height](#bc_info-endpoint) | `difficulty` |

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
  },
  "debug": {
    "cacheKey": "76f4c62584acabdeb7f0078f000fb644d588fda9"
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

MIT License
