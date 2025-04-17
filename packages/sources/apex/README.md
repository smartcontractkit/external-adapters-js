# APEX

![1.0.6](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/apex/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |                                   Default                                   |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------------------------------------------------: |
|    ✅     |       CLIENT_ID       |                                  Data Provider client ID                                  | string |         |                                                                             |
|    ✅     |     CLIENT_SECRET     |                                Data Provider client secret                                | string |         |                                                                             |
|    ✅     |         SCOPE         |                                   Scope of credentials                                    | string |         |                                                                             |
|    ✅     |      GRANT_TYPE       |                                Grant type for credentials                                 | string |         |                                                                             |
|           |   NAV_API_ENDPOINT    |                             An API endpoint for Data Provider                             | string |         | `https://api.apexgroup.com/1ASkuiqAPUyZTQqYIK8RlC6G8tWupuC7/v1/reports/NAV` |
|    ✅     |   AUTH_API_ENDPOINT   |                          An auth API endpoint for Data Provider                           | string |         |                                                                             |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |                                   `10000`                                   |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |               Note                |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------------: |
| default |                             |              6              |                           | Setting reasonable default limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | accountName |         | The account name to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "accountName": "EXAMPLE"
  }
}
```

---

MIT License
