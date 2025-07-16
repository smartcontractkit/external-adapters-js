# NAV_LIBRE

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nav-libre/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |              Default              |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-------------------------------: |
|    ✅     |        API_KEY        |                               An API key for Data Provider                                | string |         |                                   |
|    ✅     |      SECRET_KEY       |                    A key for Data Provider used in hashing the API key                    | string |         |                                   |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         | `https://api.navfundservices.com` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |             `120000`              |

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

| Required? |     Name     | Aliases |              Description              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----------: | :-----: | :-----------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | globalFundID |         | The global fund ID for the Libre fund | number |         |         |            |                |

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
