# ION.AU

![1.0.19](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ion.au/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |                       Default                       |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :-------------------------------------------------: |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://ion-digital-proof-of-reserve.instruxi.dev` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| default |                             |              5              |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                 Options                  |     Default     |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------: | :-------------: |
|           | endpoint | The endpoint to use | string | [total_reserve](#total_reserve-endpoint) | `total_reserve` |

## Total_reserve Endpoint

`total_reserve` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "total_reserve"
  }
}
```

---

MIT License
