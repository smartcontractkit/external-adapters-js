# ONRE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/onre/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |       Description        |  Type  | Options |                   Default                    |
| :-------: | :----------: | :----------------------: | :----: | :-----: | :------------------------------------------: |
|           | API_ENDPOINT | An API endpoint for OnRe | string |         | `https://onre-api-prod.ew.r.appspot.com/nav` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              2              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                          Options                          |  Default   |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [nav](#reserves-endpoint), [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

Supported names for this endpoint are: `nav`, `reserves`.

### Input Params

| Required? |    Name     | Aliases |                 Description                  |  Type  |      Options      |      Default      | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :------------------------------------------: | :----: | :---------------: | :---------------: | :--------: | :------------: |
|    ✅     |   fundId    |         |                   Fund id                    | number |                   |                   |            |                |
|           | reportValue |         | Which value to report on as top-level result | string | `net_asset_value` | `net_asset_value` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves",
    "fundId": 1,
    "reportValue": "net_asset_value"
  }
}
```

---

MIT License
