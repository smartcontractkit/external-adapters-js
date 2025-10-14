# BACKED_FI

![1.0.1](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/backed-fi/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |          Description          |  Type  | Options |               Default                |
| :-------: | :----------: | :---------------------------: | :----: | :-----: | :----------------------------------: |
|           | API_ENDPOINT | An API endpoint for Backed-Fi | string |         | `https://api.backed.fi/api/v1/token` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |               Note                |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :-------------------------------: |
| default |                             |              6              |                           | Setting reasonable default limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |              Options               |   Default    |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------: | :----------: |
|           | endpoint | The endpoint to use | string | [multiplier](#multiplier-endpoint) | `multiplier` |

## Multiplier Endpoint

`multiplier` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |            Description             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :--------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | tokenSymbol |         |    The symbol of token to query    | string |         |         |            |                |
|    ✅     |   network   |         | The symbol of the network to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "multiplier",
    "tokenSymbol": "AMZNx",
    "network": "Solana"
  }
}
```

---

MIT License
