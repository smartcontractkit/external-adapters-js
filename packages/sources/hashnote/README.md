# HASHNOTE

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/hashnote/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |            Description            |  Type  | Options |                    Default                    |
| :-------: | :---------------: | :-------------------------------: | :----: | :-----: | :-------------------------------------------: |
|           | USYC_API_ENDPOINT | URL for the USYC price report API | string |         | `https://usyc.hashnote.com/api/price-reports` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |             Note              |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------------------: |
| default |                             |              1              |                           | API only updates once per day |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                               Description                                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :----------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | token |         | The token to get the price report for. Currently only USYC is supported. | string |         | `USYC`  |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "token": "USYC"
  }
}
```

---

MIT License
