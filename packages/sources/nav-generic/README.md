# NAV_GENERIC

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nav-generic/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name         | Description  |  Type  | Options | Default |
| :-------: | :------------------: | :----------: | :----: | :-----: | :-----: |
|    ✅     | DEFAULT_API_ENDPOINT | API endpoint | string |         |         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |             Note             |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--------------------------: |
| default |                             |             20              |                           | Slower than API limit of 1/s |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                   Options                    | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint), [price](#nav-endpoint) |  `nav`  |

## Nav Endpoint

Supported names for this endpoint are: `nav`, `price`.

### Input Params

| Required? |    Name     | Aliases |       Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | integration |         | The integration to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "integration": "example-integration"
  }
}
```

---

MIT License
