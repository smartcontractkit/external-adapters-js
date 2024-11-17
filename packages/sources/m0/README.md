# M0

![0.0.4](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/m0/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |       Default        |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :------------------: |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://api.m0.xyz` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                          Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :-----------------------------------------------------: |
| default |                             |              1              |                           | Considered unlimited tier, but setting reasonable limit |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                       Options                                        |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [nav](#reserves-endpoint), [por](#reserves-endpoint), [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

Supported names for this endpoint are: `nav`, `por`, `reserves`.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves"
  }
}
```

---

MIT License
