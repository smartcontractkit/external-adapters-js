# FIREBLOCKS

![1.0.5](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/fireblocks/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |                Default                |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :-----------------------------------: |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://serenitybank.io/stablecoin/` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |       Note        |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------: |
| default |                             |              6              |                           | Reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [reserve](#reserve-endpoint) | `reserve` |

## Reserve Endpoint

`reserve` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                   Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | accountName |         | The name of the account to retrieve balances for | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserve",
    "accountName": "USDFB"
  }
}
```

---

MIT License
