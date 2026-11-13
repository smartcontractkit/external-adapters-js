# ARTEX_AMINA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/artex-amina/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name           |                             Description                              |  Type  | Options |               Default               |
| :-------: | :----------------------: | :------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           |      `API_ENDPOINT`      | AMINA host or OpenAPI server URL; a trailing /api/b2c/v1 is stripped | string |         | `https://integration.aminagroup.io` |
|    ✅     |     `AMINA_USER_ID`      |                        8-digit AMINA user ID                         | string |         |                                     |
|    ✅     |     `AMINA_PASSWORD`     |                               password                               | string |         |                                     |
|    ✅     |   `AMINA_HMAC_SECRET`    |                             HMAC secret                              | string |         |                                     |
|    ✅     | `AMINA_AGREEMENT_NUMBER` |                           agreement number                           | string |         |                                     |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [por](#por-endpoint) |  `por`  |

## Por Endpoint

`por` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |   Description    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :--------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | portfolioNo |         | portfolio number | number |         |         |            |                |
|    ✅     |    isin     |         |       ISIN       | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "por",
    "portfolioNo": 157769305,
    "isin": "US0378331005"
  }
}
```

---

MIT License
