# ARTEX_AMINA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/artex-amina/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name           |                                                 Description                                                 |  Type  | Options |               Default               |
| :-------: | :----------------------: | :---------------------------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           |      `API_ENDPOINT`      | The AMINA API host, for example https://integration.aminagroup.io or https://integration-test.aminagroup.io | string |         | `https://integration.aminagroup.io` |
|    ✅     |     `AMINA_USER_ID`      |                      The 8-digit AMINA API user ID used for login and request signing                       | string |         |                                     |
|    ✅     |     `AMINA_PASSWORD`     |                                     The password of the AMINA API user                                      | string |         |                                     |
|    ✅     |   `AMINA_HMAC_SECRET`    |                            The HMAC secret that AMINA issued for request signing                            | string |         |                                     |
|    ✅     | `AMINA_AGREEMENT_NUMBER` |                        The AMINA agreement number in scope of the positions request                         | string |         |                                     |
|    ✅     |    `AMINA_PORTFOLIO`     |                             The AMINA portfolio number that holds the positions                             | string |         |                                     |
|    ✅     |       `AMINA_ISIN`       |                           The ISIN whose position quantity the adapter publishes                            | string |         |                                     |
|           | `BACKGROUND_EXECUTE_MS`  |          The amount of time the background execute should sleep before performing the next request          | number |         |               `10000`               |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                       Note                                        |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------------------------------------------------------------: |
| default |                             |              6              |                           | AMINA documents no rate limit for read-only calls; keep the read-only poll light. |

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
