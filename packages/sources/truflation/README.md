# TRUFLATION

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/truflation/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |                                             Default                                              |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :----------------------------------------------------------------------------------------------: |
|    ✅     |   API_KEY    |   An API key for Data Provider    | string |         |                                                                                                  |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://api.truflation.com/api/v1/feed/truflation/macro-data-us/truflation_us_cpi_frozen_index` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              6              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [cpi](#cpi-endpoint) |  `cpi`  |

## Cpi Endpoint

`cpi` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "cpi"
  }
}
```

---

MIT License
