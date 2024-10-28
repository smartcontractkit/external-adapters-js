# NAV_CONSULTING

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/nav-consulting/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |             Default             |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------: |
|           |    {FUND}\_API_KEY    |                           API key, use fund in input to select                            | string |         |                                 |
|           |  {FUND}\_SECRET_KEY   |                          Secret key, use fund in input to select                          | string |         |                                 |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         | `https://api.navconsulting.net` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |             `10000`             |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [reserve](#reserve-endpoint) | `reserve` |

## Reserve Endpoint

`reserve` is the only supported name for this endpoint.

### Input Params

| Required? | Name | Aliases |                                       Description                                        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :--------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | fund |         | Name of the fund, used to select ${fund}\_API_KEY ${fund}\_SECRET_KEY from env variables | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserve",
    "fund": "Adapt3r"
  }
}
```

---

MIT License
