# GRAMCHAIN

![2.0.20](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/gramchain/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |          Description          |  Type  | Options |                   Default                   |
| :-------: | :----------: | :---------------------------: | :----: | :-----: | :-----------------------------------------: |
|           | API_ENDPOINT | An API endpoint for gramchain | string |         | `https://api-prod.gramchain.net/api/public` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| default |              5              |                             |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                   Options                    |      Default      |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------: | :---------------: |
|           | endpoint | The endpoint to use | string | [getgrambalances](#getgrambalances-endpoint) | `getgrambalances` |

## Getgrambalances Endpoint

`getgrambalances` is the only supported name for this endpoint.

### Input Params

| Required? |        Name         | Aliases |           Description           |  Type  | Options | Default  | Depends On | Not Valid With |
| :-------: | :-----------------: | :-----: | :-----------------------------: | :----: | :-----: | :------: | :--------: | :------------: |
|           |     custodianID     |         | The identifier of the custodian | string |         | `Cache`  |            |                |
|           |      metalCode      |         |     The symbol of the metal     | string |         |   `AU`   |            |                |
|           | utilizationLockCode |         |  The status of the utilization  | string |         | `Locked` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "getgrambalances",
    "custodianID": "Cache",
    "metalCode": "AU",
    "utilizationLockCode": "Locked"
  }
}
```

---

MIT License
