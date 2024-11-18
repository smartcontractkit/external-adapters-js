# ELVEN

![1.0.21](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/elven/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |      Description       |  Type  | Options |         Default         |
| :-------: | :----------: | :--------------------: | :----: | :-----: | :---------------------: |
|           | API_ENDPOINT | API Endpoint for Elven | string |         | `https://por.elven.com` |
|    ✅     |   API_KEY    |   API Key for Elven    | string |         |                         |
|    ✅     |  API_SECRET  |  API Secret for Elven  | string |         |                         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| default |             50              |                             |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |        Options         | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [hope](#hope-endpoint) | `hope`  |

## Hope Endpoint

`hope` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "hope"
  }
}
```

---

MIT License
