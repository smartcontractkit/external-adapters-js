# MATRIXDOCK

![2.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/matrixdock/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                    Description                     |  Type  | Options |            Default            |
| :-------: | :----------: | :------------------------------------------------: | :----: | :-----: | :---------------------------: |
|    ✅     |   API_KEY    |             An API key for Matrixdock              | string |         |                               |
|    ✅     |  API_SECRET  | An API secret for Matrixdock used to sign requests | string |         |                               |
|           | API_ENDPOINT |           An API endpoint for Matrixdock           | string |         | `https://mapi.matrixport.com` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |              5              |                             |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases |           Description            |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | The symbol to query (e.g., XAUM) | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "symbol": "XAUM"
  }
}
```

---

MIT License
