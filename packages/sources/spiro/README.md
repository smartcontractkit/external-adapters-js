# SPIRO

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/spiro/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name      |                       Description                       |  Type  | Options |                         Default                         |
| :-------: | :------------: | :-----------------------------------------------------: | :----: | :-----: | :-----------------------------------------------------: |
|           | `API_ENDPOINT` | The base URL of the Spiro API, including the funds path | string |         | `https://rwa-wireframes.vercel.app/api/chainlink/funds` |
|    ✅     |   `API_KEY`    | API key for the Spiro API, sent as the x-api-key header | string |         |                                                         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                         Note                                         |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :----------------------------------------------------------------------------------: |
| default |                             |             20              |                           | Spiro does not publish a rate limit; using a conservative 1 request every 3 seconds. |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                  Options                   | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint), [por](#por-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | fundId |         |   Fund id   | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "fundId": "michigan-pilot"
  }
}
```

---

## Por Endpoint

`por` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | fundId |         |   Fund id   | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "por",
    "fundId": "michigan-pilot"
  }
}
```

---

MIT License
