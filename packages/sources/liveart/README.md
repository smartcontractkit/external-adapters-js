# LIVE_ART

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/liveart/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                Description                |  Type  | Options |                     Default                      |
| :-------: | :----------: | :---------------------------------------: | :----: | :-----: | :----------------------------------------------: |
|    ✅     | API_BASE_URL | The API URL for the LiveArt data provider | string |         | `https://artwork-price-oracle-api-ms.liveart.ai` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |               Note                |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------------: |
| default |              1              |                             |                           | Setting reasonable default limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |             Description              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :----------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | assetId |         | The ID of the artwork asset to fetch | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "assetId": "KUSPUM"
  }
}
```

---

MIT License
