# DEEP_BLUE

![1.0.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/deep-blue/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |            Description            |  Type  | Options |                            Default                            |
| :-------: | :----------: | :-------------------------------: | :----: | :-----: | :-----------------------------------------------------------: |
|    ✅     |   API_KEY    |   An API key for Data Provider    | string |         |                                                               |
|           | API_ENDPOINT | An API endpoint for Data Provider | string |         | `https://d0qqxbypoa.execute-api.ap-southeast-2.amazonaws.com` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                                  Note                                   |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :---------------------------------------------------------------------: |
| default |                             |              6              |                           | Deep Blue does not describe a rate limit, but setting reasonable limits |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [reserve](#reserve-endpoint) | `reserve` |

## Reserve Endpoint

`reserve` is the only supported name for this endpoint.

### Input Params

| Required? |    Name     | Aliases |                    Description                    |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :-----------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|           | accountName |         | The name of the account to retrieve balances for. | string |         | `DBUSD` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserve",
    "accountName": "DBUSD"
  }
}
```

---

MIT License
