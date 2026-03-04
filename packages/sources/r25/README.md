# R25

![1.1.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/r25/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                 Description                 |  Type  | Options |        Default        |
| :-------: | :----------: | :-----------------------------------------: | :----: | :-----: | :-------------------: |
|    ✅     |   API_KEY    |             An API key for R25              | string |         |                       |
|    ✅     |  API_SECRET  | An API secret for R25 used to sign requests | string |         |                       |
|           | API_ENDPOINT |           An API endpoint for R25           | string |         | `https://app.r25.xyz` |

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

| Required? |   Name    | Aliases |             Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :---------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | chainType |         | The chain type (e.g., polygon, sui) | string |         |         |            |                |
|    ✅     | tokenName |         |    The token name (e.g., rcusdp)    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "chainType": "polygon",
    "tokenName": "rcusdp"
  }
}
```

---

MIT License
