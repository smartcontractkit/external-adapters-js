# KAIKO_STATE

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/kaiko-state/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                        Description                                        |  Type  | Options |             Default             |
| :-------: | :-------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------: |
|    ✅     |        API_KEY        |                               An API key for Data Provider                                | string |         |                                 |
|           |     API_ENDPOINT      |                             An API endpoint for Data Provider                             | string |         | `gateway-v0-grpc.kaiko.ovh:443` |
|           | BACKGROUND_EXECUTE_MS | The amount of time the background execute should sleep before performing the next request | number |         |             `10000`             |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [state](#state-endpoint) | `state` |

## State Endpoint

`state` is the only supported name for this endpoint.

### Input Params

| Required? | Name  |              Aliases               |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :--------------------------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from`, `market`, `symbol` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | quote |          `convert`, `to`           | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "state",
    "base": "ageur",
    "quote": "USD"
  }
}
```

---

MIT License
