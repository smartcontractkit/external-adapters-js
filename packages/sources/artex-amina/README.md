# ARTEX_AMINA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/artex-amina/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name           |                                                     Description                                                      |  Type  | Options | Default |
| :-------: | :----------------------: | :------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |      `API_ENDPOINT`      | The AMINA API origin, without a path. The production and the sandbox environment have separate hosts and credentials | string |         |         |
|    ✅     |     `AMINA_USER_ID`      |                              The AMINA user ID of the account that reads the portfolios                              | string |         |         |
|    ✅     |     `AMINA_PASSWORD`     |                                            The password of the AMINA user                                            | string |         |         |
|    ✅     |   `AMINA_HMAC_SECRET`    |                                  The HMAC secret that signs each positions request                                   | string |         |         |
|    ✅     | `AMINA_AGREEMENT_NUMBER` |                         The AMINA context agreement number that the positions request signs                          | string |         |         |

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

| Required? |   Name    | Aliases |                     Description                      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :--------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | portfolio |         | The number of the portfolio whose positions are read | string |         |         |            |                |
|    ✅     |   isin    |         |      The ISIN of the single position to report       | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserve",
    "portfolio": "900000001",
    "isin": "DE0000000001"
  }
}
```

---

MIT License
