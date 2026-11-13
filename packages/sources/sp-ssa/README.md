# SP_SSA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/sp-ssa/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name       |                 Description                 |  Type  | Options | Default |
| :-------: | :--------------: | :-----------------------------------------: | :----: | :-----: | :-----: |
|    ✅     |  `API_ENDPOINT`  |  The S&P SSA base URL for the environment   | string |         |         |
|    ✅     | `TOKEN_ENDPOINT` | The S&P OAuth token URL for the environment | string |         |         |
|    ✅     |   `CLIENT_ID`    |           The S&P OAuth client id           | string |         |         |
|    ✅     |    `API_KEY`     |  The S&P apikey sent on SSA data requests   | string |         |         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                                                                                                                                                                                        Note                                                                                                                                                                                                        |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------: |
| default |                             |             10              |                           | The provider hard cap is 300/min per apikey per environment, shared across all DON nodes. The 10/min tier is a safe per-process share for up to 30 processes; set RATE_LIMIT_CAPACITY_MINUTE to floor(300 / instances). The burst strategy lets the token and first data call run immediately on a cold start and can cluster up to 10 requests at a minute boundary, so the deployment must size for that window. |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [ssa](#ssa-endpoint) |  `ssa`  |

## Ssa Endpoint

`ssa` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                        Description                         |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :--------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | security_id |         | The S&P security identifier to report, for example SP-EURC | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "ssa",
    "security_id": "SP-EURC"
  }
}
```

---

MIT License
