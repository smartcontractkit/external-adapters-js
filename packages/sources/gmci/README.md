# GMCI

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/gmci/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |      Name       |            Description             |  Type  | Options | Default |
| :-------: | :-------------: | :--------------------------------: | :----: | :-----: | :-----: |
|    ✅     |     API_KEY     |    An API key for Data Provider    | string |         |         |
|    ✅     | WS_API_ENDPOINT | WS endpoint for GMCI Data Provider | string |         |         |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  | Aliases | Description |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :----: | :-----: | :---------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | symbol |         | Index name  | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "symbol": "GMCI30"
  }
}
```

---

MIT License
