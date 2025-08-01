# ONDO

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/ondo/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |                  Description                   |  Type  | Options |            Default             |
| :-------: | :----------: | :--------------------------------------------: | :----: | :-----: | :----------------------------: |
|           | API_ENDPOINT |           The API endpoint for Ondo            | string |         | `https://api.gm.ondo.finance/` |
|    ✅     |   API_KEY    | An API key required to access the API_ENDPOINT | string |         |                                |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |              2              |                             |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases  |                Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :------: | :---------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | asset | `symbol` | Asset price to request from Data Provider | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "asset": "AAPLon"
  }
}
```

---

MIT License
