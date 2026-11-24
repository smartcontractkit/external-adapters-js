# SPGLOBAL

![1.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/spglobal/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name           |                                        Description                                        |  Type  | Options |                   Default                   |
| :-------: | :---------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------------------: |
|           |     `API_ENDPOINT`      |                                   The S&P SSA base URL                                    | string |         | `https://api.glb.prod.ratings.spglobal.com` |
|           |   `AUTH_API_ENDPOINT`   |                                  The S&P OAuth token URL                                  | string |         |   `https://secureapi.signin.spglobal.com`   |
|    ✅     |        `API_KEY`        |                                 API KEY for API_ENDPOINT                                  | string |         |                                             |
|    ✅     |     `AUTH_API_KEY`      |                               API KEY for AUTH_API_ENDPOINT                               | string |         |                                             |
|           | `BACKGROUND_EXECUTE_MS` | The amount of time the background execute should sleep before performing the next request | number |         |                   `10000`                   |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |       Options        | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [ssa](#ssa-endpoint) |  `ssa`  |

## Ssa Endpoint

`ssa` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |        Description         |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | security_id |         | Identifier of the security | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "ssa",
    "security_id": "example"
  }
}
```

---

MIT License
