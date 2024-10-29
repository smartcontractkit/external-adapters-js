# HARRIS-AND-TROTTER

![1.0.8](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/harris-and-trotter/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |        Name         |                    Description                     |  Type  | Options |                 Default                  |
| :-------: | :-----------------: | :------------------------------------------------: | :----: | :-----: | :--------------------------------------: |
|    ✅     |       API_KEY       |            An API key for Data Provider            | string |         |                                          |
|           | {KEY_NAME}\_API_KEY | Alternative API key, use apiKey in input to select | string |         |                                          |
|           |    API_ENDPOINT     |         An API endpoint for Data Provider          | string |         | `https://api.harrisandtrotter.co.uk/api` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour | Note |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :--: |
| default |                             |              6              |                           |      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint) | `balance` |

## Balance Endpoint

`balance` is the only supported name for this endpoint.

### Input Params

| Required? |    Name    | Aliases |                                            Description                                             |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--------: | :-----: | :------------------------------------------------------------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | clientName |         |                          The name of the client to retrieve balances for.                          | string |         |         |            |                |
|           |   apiKey   |         | Alternative api keys to use for this request, ${apiKey}\_API_KEY required in environment variables | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "clientName": "TUSD",
    "apiKey": ""
  }
}
```

---

MIT License
