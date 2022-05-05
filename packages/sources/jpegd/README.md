# Chainlink External Adapter for JPEG'd

![1.1.13](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/jpegd/package.json)

Query NFT collection values from the JPEG'd API.

Base URL https://jpegapi.com

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |  Name   |              Description               |  Type  | Options | Default |
| :-------: | :-----: | :------------------------------------: | :----: | :-----: | :-----: |
|    ✅     | API_KEY | An API key provided by the JPEG'd team | string |         |         |

---

## Input Parameters

| Required? |   Name   |     Description     |                            Options                            | Defaults to |
| :-------: | :------: | :-----------------: | :-----------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [punks](#punks-endpoint) [collections](#collections-endpoint) |    punks    |

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [punks](#punks-endpoint) | `punks` |

## Collections Endpoint

Queries JPEG'd API for the value of a floor NFT from the requested collection. Supersedes the Punks endpoint in functionality and will be used for all new collections moving forward.

### Input Params

| Required? |     Name     |           Description            | Options | Defaults to |
| :-------: | :----------: | :------------------------------: | :-----: | :---------: |
|    ✅     | `collection` | The NFT collection being queried |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "collection": "boredapeyachtclub"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "success": true,
    "block": 9999999,
    "value": 100
  },
  "statusCode": 200
}
```

## Punks Endpoint

Queries JPEG'd API for the value of a floor Cryptopunk at the requested block.

`punks` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |             Description              | Options | Defaults to |
| :-------: | :-----: | :----------------------------------: | :-----: | :---------: |
|           | `block` | The block data is being queried from |         |   latest    |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "block": "latest"
  }
}
```

Response:

```json
{
  "data": {
    "result": 71.71525868055556
  },
  "jobRunID": "1",
  "providerStatusCode": 200,
  "result": 71.71525868055556,
  "statusCode": 200
}
```

---

MIT License
