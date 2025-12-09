# NAV_FUND_SERVICES

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nav-fund-services/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |            Name             |                                        Description                                        |  Type  | Options |              Default              |
| :-------: | :-------------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------: |
|           |        API_ENDPOINT         |                             An API endpoint for Data Provider                             | string |         | `https://api.navfundservices.com` |
|    ✅     |  API_KEY\_${globalFundID}   |                         API key for the specified global fund ID                          | string |         |                                   |
|    ✅     | SECRET_KEY\_${globalFundID} |                        Secret key for the specified global fund ID                        | string |         |                                   |
|           |    BACKGROUND_EXECUTE_MS    | The amount of time the background execute should sleep before performing the next request | number |         |             `120000`              |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [nav](#nav-endpoint) |  `nav`  |

## Nav Endpoint

`nav` is the only supported name for this endpoint.

### Input Params

| Required? |     Name     | Aliases |                                    Description                                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----: | :--------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | globalFundID |         | Used to match `API_KEY_${globalFundID}` `SECRET_KEY_${globalFundID}` env variables | number |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "globalFundID": 1234
  }
}
```

---

MIT License
