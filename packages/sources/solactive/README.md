# SOLACTIVE

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/solactive/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Variable env vars

- The `clientId` input param maps to an env var `PASSWORD_{clientId}` used for auth

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |                       Default                       |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :-------------------------------------------------: |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://clients.solactive.com/api/rest/v1/indices` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                   Note                   |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--------------------------------------: |
| default |                             |             12              |                           | Conservative rate limit as key is shared |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |   Name   | Aliases |              Description               |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :------: | :-----: | :------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | clientId |         | The client ID associated with the fund | string |         |         |            |                |
|    ✅     |   isin   |         |     The ISIN identifying the fund      | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "clientId": "abc123",
    "isin": "A0B1C2D3"
  }
}
```

---

MIT License
