# SUPERSTATE

![1.3.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/superstate/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |          Name          |                                          Description                                          |  Type  | Options |            Default             |
| :-------: | :--------------------: | :-------------------------------------------------------------------------------------------: | :----: | :-----: | :----------------------------: |
|           |      API_ENDPOINT      |                                An API endpoint for Superstate                                 | string |         | `https://api.superstate.co/v1` |
|           |  TRANSACTION_API_KEY   |                          Api key for /v2/transactions API endpoints                           | string |         |                                |
|           | TRANSACTION_API_SECRET |                         Api secret for /v2/transactions API endpoints                         | string |         |                                |
|           |     LOOKBACK_DAYS      |                       The number of days of historical data to retrieve                       | number |         |              `10`              |
|           |   RETRY_INTERVAL_MS    | The amount of time (in ms) to wait before sending a new request for getting an updated price. | number |         |            `60000`             |
|           | BACKGROUND_EXECUTE_MS  |   The amount of time the background execute should sleep before performing the next request   | number |         |            `10000`             |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                           Options                                                            |  Default   |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------------------------------------------------: | :--------: |
|           | endpoint | The endpoint to use | string | [nav](#reserves-endpoint), [por](#reserves-endpoint), [reserves](#reserves-endpoint), [transactions](#transactions-endpoint) | `reserves` |

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

## Transactions Endpoint

`transactions` is the only supported name for this endpoint.

### Input Params

| Required? |       Name        | Aliases |                Description                |   Type   |        Options         | Default | Depends On | Not Valid With |
| :-------: | :---------------: | :-----: | :---------------------------------------: | :------: | :--------------------: | :-----: | :--------: | :------------: |
|    ✅     |      fundId       |         |       Used to fetch Net Asset Value       |  number  |                        |         |            |                |
|    ✅     |      ticker       |         |        Used to fetch transactions         |  string  |                        |         |            |                |
|    ✅     | transactionStatus |         |     Used to query transaction_status      |  string  | `Completed`, `Pending` |         |            |                |
|    ✅     |    operations     |         | Used to match transactions operation_type | string[] |                        |         |            |                |
|    ✅     |     decimals      |         |      Number of decimals of response       |  number  |                        |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "transactions",
    "fundId": 1,
    "ticker": "tickerName",
    "transactionStatus": "Completed",
    "operations": ["open"],
    "decimals": 18
  }
}
```

---

MIT License
