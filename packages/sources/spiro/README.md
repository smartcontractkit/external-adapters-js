# SPIRO

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/spiro/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name      |                       Description                       |  Type  | Options |               Default               |
| :-------: | :------------: | :-----------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           | `API_ENDPOINT` |              The base URL of the Spiro API              | string |         | `https://rwa-wireframes.vercel.app` |
|    ✅     |   `API_KEY`    | API key for the Spiro API, sent as the x-api-key header | string |         |                                     |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                                                  Note                                                                  |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------------------------------------------------------------------------------------: |
| default |                             |             60              |                           | The API updates once per day. 60 calls/min (one call per second) paces the warmer and keeps a cold read inside the client poll window. |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                  Options                   | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint), [por](#por-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |       Name       | Aliases |                                                                   Description                                                                    |  Type   |                   Options                    |      Default      | Depends On | Not Valid With |
| :-------: | :--------------: | :-----: | :----------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :------------------------------------------: | :---------------: | :--------: | :------------: |
|    ✅     |      fundId      |         |                                                                     Fund id                                                                      | string  |                                              |                   |            |                |
|           |   reportValue    |         |                                                             Which value to report on                                                             | string  | `assets_under_management`, `net_asset_value` | `net_asset_value` |            |                |
|           | noErrorOnRipcord |         | Lax ripcord handling, return 200 on ripcord when noErrorOnRipcord is true, return 502 with ripcord details if noErrorOnRipcord is false or unset | boolean |                                              |                   |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "fundId": "michigan-pilot",
    "reportValue": "net_asset_value",
    "noErrorOnRipcord": false
  }
}
```

---

## Por Endpoint

`por` is the only supported name for this endpoint.

### Input Params

| Required? |       Name       | Aliases |                                                                   Description                                                                    |  Type   |    Options     |    Default     | Depends On | Not Valid With |
| :-------: | :--------------: | :-----: | :----------------------------------------------------------------------------------------------------------------------------------------------: | :-----: | :------------: | :------------: | :--------: | :------------: |
|    ✅     |      fundId      |         |                                                                     Fund id                                                                      | string  |                |                |            |                |
|           |   reportValue    |         |                                                   Which value to report on as top-level result                                                   | string  | `totalReserve` | `totalReserve` |            |                |
|           | noErrorOnRipcord |         | Lax ripcord handling, return 200 on ripcord when noErrorOnRipcord is true, return 502 with ripcord details if noErrorOnRipcord is false or unset | boolean |                |                |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "por",
    "fundId": "michigan-pilot",
    "reportValue": "totalReserve",
    "noErrorOnRipcord": false
  }
}
```

---

MIT License
