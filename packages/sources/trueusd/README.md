# TRUEUSD

![3.0.21](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/trueusd/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |       Description       |  Type  | Options |                      Default                       |
| :-------: | :----------: | :---------------------: | :----: | :-----: | :------------------------------------------------: |
|           | API_ENDPOINT | API endpoint of adapter | string |         | `https://api.real-time-reserves.ledgerlens.io/v1/` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              6              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [trueusd](#trueusd-endpoint) | `trueusd` |

## Trueusd Endpoint

`trueusd` is the only supported name for this endpoint.

### Input Params

| Required? | Name  | Aliases |                                                   Description                                                    |  Type  | Options |   Default    | Depends On | Not Valid With |
| :-------: | :---: | :-----: | :--------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :----------: | :--------: | :------------: |
|           | chain |         |                                        Filter data to a single blockchain                                        | string |         |              |            |                |
|           | field |         | The object-path string to parse a single `result` value. When not provided the entire response will be provided. | string |         | `totalTrust` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "trueusd",
    "field": "totalTrust"
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "trueusd",
    "chain": "AVA",
    "field": "totakToken"
  }
}
```

Request:

```json
{
  "data": {
    "endpoint": "trueusd",
    "chain": "TUSD (AVAX)",
    "field": "totalTokenByChain"
  }
}
```

</details>

---

MIT License
