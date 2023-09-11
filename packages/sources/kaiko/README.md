# KAIKO

![2.0.7](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/kaiko/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |     Name     |      Description       |  Type  | Options |                      Default                       |
| :-------: | :----------: | :--------------------: | :----: | :-----: | :------------------------------------------------: |
|    ✅     |   API_KEY    |   API KEY for KAIKO    | string |         |                                                    |
|           | API_ENDPOINT | API endpoint for KAIKO | string |         | `https://us.market-api.kaiko.io/v2/data/trades.v2` |

---

## Data Provider Rate Limits

|  Name   | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                           Note                           |
| :-----: | :-------------------------: | :-------------------------: | :-----------------------: | :------------------------------------------------------: |
| default |             100             |                             |                           | Considered unlimited tier, but setting reasonable limits |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  |                                      Options                                      | Default  |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [crypto](#trades-endpoint), [price](#trades-endpoint), [trades](#trades-endpoint) | `trades` |

## Trades Endpoint

Supported names for this endpoint are: `crypto`, `price`, `trades`.

### Input Params

| Required? |      Name       |    Aliases     |                                                      Description                                                      |  Type  | Options |  Default   | Depends On | Not Valid With |
| :-------: | :-------------: | :------------: | :-------------------------------------------------------------------------------------------------------------------: | :----: | :-----: | :--------: | :--------: | :------------: |
|    ✅     |      base       | `coin`, `from` |                                    The symbol of symbols of the currency to query                                     | string |         |            |            |                |
|    ✅     |      quote      | `market`, `to` |                                       The symbol of the currency to convert to                                        | string |         |            |            |                |
|           |    interval     |                | The time interval to use in the query. NOTE: Changing this will likely require changing `millisecondsAgo` accordingly | string |         |    `2m`    |            |                |
|           | millisecondsAgo |                |            Number of milliseconds from the current time that will determine start_time to use in the query            | string |         | `86400000` |            |                |
|           |      sort       |                |                                   Which way to sort the data returned in the query                                    | string |         |   `desc`   |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

Response:

```json
{
  "data": {
    "result": 1556.3953823343438
  },
  "result": 1556.3953823343438,
  "timestamps": {
    "providerDataRequestedUnixMs": 1694451765892,
    "providerDataReceivedUnixMs": 1694451766532,
    "providerIndicatedTimeUnixMs": 1694451720000
  },
  "statusCode": 200,
  "meta": {
    "adapterName": "KAIKO",
    "metrics": {
      "feedId": "{\"base\":\"eth\",\"quote\":\"usd\",\"interval\":\"2m\",\"millisecondsAgo\":\"86400000\",\"sort\":\"desc\"}"
    }
  }
}
```

---

MIT License
