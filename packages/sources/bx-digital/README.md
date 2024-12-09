# BX_DIGITAL

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/bx-digital/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |                       Default                       |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :-------------------------------------------------: |
|    ✅     |   API_KEY    |   An API key for Data Provider    | string |         |                                                     |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://dev-cdf-stage-k8s.bxdigital.ch/securities` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |       Note        |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------: |
| default |                             |              6              |                           | Reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |              Description              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :-----------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | securityId |         | ID of the security to report price on | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "securityId": "CH0012032048"
  }
}
```

---

MIT License
