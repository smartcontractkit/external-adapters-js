# SUPERSTATE

![1.2.3](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/superstate/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |       Name        |                                          Description                                          |  Type  | Options |            Default             |
| :-------: | :---------------: | :-------------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------: |
|           |   API_ENDPOINT    |                                An API endpoint for Superstate                                 | string |         | `https://api.superstate.co/v1` |
|           |   LOOKBACK_DAYS   |                       The number of days of historical data to retrieve                       | number |         |              `10`              |
|           | RETRY_INTERVAL_MS | The amount of time (in ms) to wait before sending a new request for getting an updated price. | number |         |            `60000`             |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                       Options                                        |  Default   |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [nav](#reserves-endpoint), [por](#reserves-endpoint), [reserves](#reserves-endpoint) | `reserves` |

## Reserves Endpoint

Supported names for this endpoint are: `nav`, `por`, `reserves`.

### Input Params

| Required? |    Name     | Aliases |       Description        |  Type  |                   Options                    |      Default      | Depends On | Not Valid With |
| :-------: | :---------: | :-----: | :----------------------: | :----: | :------------------------------------------: | :---------------: | :--------: | :------------: |
|    ✅     |   fundId    |         |         Fund id          | number |                                              |                   |            |                |
|           | reportValue |         | Which value to report on | string | `assets_under_management`, `net_asset_value` | `net_asset_value` |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "reserves",
    "fundId": 1,
    "reportValue": "net_asset_value"
  }
}
```

---

MIT License
