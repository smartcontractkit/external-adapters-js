# SECURITIZE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/securitize/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |             Description             |  Type  | Options |                            Default                            |
| :-------: | :----------: | :---------------------------------: | :----: | :-----: | :-----------------------------------------------------------: |
|    ✅     |   API_KEY    |    An API key for Securitize NAV    | string |         |                                                               |
|           | API_ENDPOINT | The API endpoint for Securitize NAV | string |         | `https://partners-api.securitize.io/asset-metrics/api/v1/nav` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                   Note                   |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--------------------------------------: |
| default |                             |             30              |                           | 500/minute but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     | Aliases |                              Description                              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----: | :-------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     |   assetId    |         |                        The assetId of the fund                        | string |         |         |            |                |
|    ✅     | envVarPrefix |         | Maps the assetId to the {envVarPrefix.toUpperCase()}\_PUBKEYS env var | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "assetId": "c52c3d79-8317-4692-86f8-4e0dfd508672",
    "envVarPrefix": "testAsset"
  }
}
```

---

MIT License
