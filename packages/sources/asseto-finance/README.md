# ASSETO_FINANCE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/asseto-finance/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |            Default             |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------: |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         | `https://open.syncnav.com/api` |
|           |       CLIENT_ID       |                                  Data Provider client ID                                  | string |         |          `chainlink`           |
|    ✅     |     CLIENT_SECRET     |                                Data Provider client secret                                | string |         |                                |
|           |      GRANT_TYPE       |                                Grant type for credentials                                 | string |         |      `client_credentials`      |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |            `10000`             |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                       |  Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint), [reserve](#reserve-endpoint) | `reserve` |

## Reserve Endpoint

`reserve` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |             Description              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :----------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | fundId |         | The fund id of the reserves to query | number |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserve",
    "fundId": 3
  }
}
```

---

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |             Description              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :----------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | fundId |         | The fund id of the reserves to query | number |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "fundId": 3
  }
}
```

---

MIT License
