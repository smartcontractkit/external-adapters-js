# NOMIA2

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nomia2/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options | Default |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :-----: |
|    ✅     |   API_KEY    |   An API key for Data Provider    | string |         |         |
|    ✅     | API_ENDPOINT | An API endpoint for Data Provider | string |         |         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                Note                 |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------------------------: |
| default |                             |                             |            12             | Docs: 500 requests per day per auth |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |               Options                |    Default    |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------: | :-----------: |
|           | endpoint | The endpoint to use | string | [batch-index](#batch-index-endpoint) | `batch-index` |

## Batch-index Endpoint

`batch-index` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |          Description           |   Type   | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :----------------------------: | :------: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | indices |         | Indices array to query API for | string[] |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "batch-index",
    "indices": ["12345A67890", "234567B8901"]
  }
}
```

---

MIT License
