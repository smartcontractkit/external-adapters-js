# MOORE-HK

![1.0.15](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/moore-hk/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |              Description              |  Type  | Options |                      Default                      |
| :-------: | :----------: | :-----------------------------------: | :----: | :-----: | :-----------------------------------------------: |
|           | API_ENDPOINT | An API endpoint for the Data Provider | string |         | `https://api.real-time-reserves.verinumus.io/v1/` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              6              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [trueusd](#trueusd-endpoint) | `trueusd` |

## Trueusd Endpoint

`trueusd` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                       Description                        |  Type  | Options |   Default    | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :------------------------------------------------------: | :----: | :-----: | :----------: | :--------: | :------------: |
|           | field |         | The object-path string to parse a single `result` value. | string |         | `totalTrust` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "trueusd",
    "field": "totalTrust"
  }
}
```

---

MIT License
