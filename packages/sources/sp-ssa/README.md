# SP_SSA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/sp-ssa/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name         |                                     Description                                      |  Type  | Options |                                 Default                                 |
| :-------: | :-----------------: | :----------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------------------------------------------: |
|           |   `API_ENDPOINT`    | The S&P SSA API base URL. The adapter appends the path of the scores resource to it. | string |         | `https://api.use1.uat.ratings.spglobal.com/ssa-defiscoreapi/extoauthv2` |
|           | `AUTH_API_ENDPOINT` |        The S&P token endpoint that issues the JWT the scores request carries         | string |         |      `https://secureapi.signinpreview.spglobal.com/gettoken/token`      |
|    ✅     |  `SPGI_CLIENT_ID`   |             The S&P client id that the token request authenticates with              | string |         |                                                                         |
|    ✅     |    `SPGI_APIKEY`    |                    The S&P apikey that the scores request carries                    | string |         |                                                                         |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                            Note                             |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------------------------------------------------: |
| default |                             |             300             |                           | The S&P API accepts 300 requests each minute for one apikey |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [ssa](#ssa-endpoint) |  `ssa`  |

## Ssa Endpoint

`ssa` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                              Description                              |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :-------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | security_id |         | The S&P security id whose SSA score is published, for example SP-EURC | string |         |         |            |                |

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
