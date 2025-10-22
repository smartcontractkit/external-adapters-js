# COINPAPRIKA_STATE

![2.7.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/coinpaprika-state/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [Input Parameters](#Input-Parameters) for a list of environments variables and [Schemas](#Schemas) for additional examples.

## Environment Variables

| Required? |          Name           |                                        Description                                        |  Type  | Options |                   Default                    |
| :-------: | :---------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |        `API_KEY`        |                                An API key for Coinpaprika                                 | string |         |                                              |
|           |     `API_ENDPOINT`      |                              An API endpoint for Coinpaprika                              | string |         | `https://chainlink-streaming.dexpaprika.com` |
|           | `BACKGROUND_EXECUTE_MS` | The amount of time the background execute should sleep before performing the next request | number |         |                    `3000`                    |
|           |  `REQUEST_TIMEOUT_MS`   |                 Timeout for HTTP requests to the provider in milliseconds                 | number |         |                   `60000`                    |
|           |  `RECONNECT_DELAY_MS`   |                   Base delay for reconnection attempts in milliseconds                    | number |         |                    `5000`                    |

---

## Input Parameters

Every EA supports base input parameters from [this list](https://github.com/smartcontractkit/ea-framework-js/blob/main/src/config/index.ts)

| Required? |   Name   |     Description     |  Type  | Options | Default |
| :-------: | :------: | :-----------------: | :----: | :-----: | :-----: |
|           | endpoint | The endpoint to use | string |         |         |

## Coinpaprika-state Endpoint

`coinpaprika-state` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   |    Aliases     |               Description                |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :-----: | :------------: | :--------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | `base`  | `coin`, `from` |   The symbol of the currency to query    | string |         |         |            |                |
|    ✅     | `quote` | `market`, `to` | The symbol of the currency to convert to | string |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "base": "LUSD",
    "quote": "USD"
  },
  "debug": {
    "cacheKey": "YlEjKJJLVmjXzFKQjFjVtKmQWlM="
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "result": 1.000979,
    "timestamp": 1758888503
  },
  "result": 1.000979,
  "statusCode": 200,
  "timestamps": {
    "providerDataRequestedUnixMs": 1758888508939,
    "providerDataReceivedUnixMs": 1758888508939,
    "providerIndicatedTimeUnixMs": 1758888503000
  }
}
```

---

## Known Issues

See [known-issues.md](./known-issues.md) for detailed information about streaming data, connection management, and error handling.

---

MIT License
