# Chainlink External Adapter for blockstream

Version: 1.2.16

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                          Options                           |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [difficulty](#blocks-endpoint), [height](#blocks-endpoint) | `difficulty` |

---

## Blocks Endpoint

Supported names for this endpoint are: `difficulty`, `height`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "height",
    "resultPath": "difficulty"
  }
}
```

Response:

```json
{
  "result": 22335659268936
}
```

---
