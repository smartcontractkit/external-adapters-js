# ARTEX_AMINA

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/artex-amina/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |           Name           |                                        Description                                        |  Type  | Options |               Default               |
| :-------: | :----------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :---------------------------------: |
|           |      `API_ENDPOINT`      |                            The AMINA API host, without a path                             | string |         | `https://integration.aminagroup.io` |
|    ✅     |     `AMINA_USER_ID`      |                 The AMINA user id that the adapter signs its requests as                  | string |         |                                     |
|    ✅     |     `AMINA_PASSWORD`     |                              The password of the AMINA user                               | string |         |                                     |
|    ✅     |   `AMINA_HMAC_SECRET`    |                    The secret that signs each AMINA positions request                     | string |         |                                     |
|    ✅     | `AMINA_AGREEMENT_NUMBER` |                   The AMINA agreement that the positions are read under                   | string |         |                                     |
|           | `BACKGROUND_EXECUTE_MS`  | The amount of time the background execute should sleep before performing the next request | number |         |               `10000`               |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |            Options             |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

`reserves` is the only supported name for this endpoint.

### Input Params

| Required? |   Name    | Aliases |                    Description                     |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-------: | :-----: | :------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | portfolio |         | The AMINA portfolio number that holds the position | string |         |         |            |                |
|    ✅     |   isin    |         |        The ISIN of the position to publish         | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves",
    "portfolio": "910000001",
    "isin": "XS0000000001"
  }
}
```

---

MIT License
