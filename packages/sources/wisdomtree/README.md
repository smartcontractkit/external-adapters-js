# WISDOMTREE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/wisdomtree/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |               Default                |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :----------------------------------: |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://dataspanapi.wisdomtree.com` |
|    ✅     |   API_KEY    |     WisdomTree API key value      | string |         |                                      |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |       Note        |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------: |
| default |                             |              2              |                           | Reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |      Aliases       |              Description               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :----------------: | :------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | ticker | `fundId`, `symbol` | The symbol of the fund ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "ticker": "WTGXX"
  }
}
```

---

MIT License
