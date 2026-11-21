# ARTEX_AMINA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/artex-amina/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name           |                                           Description                                            |  Type  | Options |               Default               |
| :-------: | :----------------------: | :----------------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           |      `API_ENDPOINT`      |        The AMINA API host (the production host by default; the sandbox host is accepted)         | string |         | `https://integration.aminagroup.io` |
|    ✅     |     `AMINA_USER_ID`      | The 8-digit AMINA user ID used to log in and to sign requests (the provider calls it non-secret) | string |         |                                     |
|    ✅     |     `AMINA_PASSWORD`     |                                  The password of the AMINA user                                  | string |         |                                     |
|    ✅     |   `AMINA_HMAC_SECRET`    |                         The HMAC secret AMINA issued for request signing                         | string |         |                                     |
|    ✅     | `AMINA_AGREEMENT_NUMBER` |                      The AMINA agreement number the requests are made under                      | string |         |                                     |
|    ✅     |    `AMINA_PORTFOLIO`     |                       The AMINA portfolio number whose positions are read                        | string |         |                                     |
|    ✅     |       `AMINA_ISIN`       |                            The ISIN of the single position to publish                            | string |         |                                     |

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

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserve"
  }
}
```

---

MIT License
