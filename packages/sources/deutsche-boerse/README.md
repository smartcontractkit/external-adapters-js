# DEUTSCHE_BOERSE

![1.3.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/deutsche-boerse/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |         Name          |                                   Description                                   |  Type  | Options |            Default             |
| :-------: | :-------------------: | :-----------------------------------------------------------------------------: | :----: | :-----: | :----------------------------: |
|    ✅     |        API_KEY        |                          An API key for Data Provider                           | string |         |                                |
|    ✅     |    WS_API_ENDPOINT    |                          WS endpoint for Data Provider                          | string |         | `wss://md.deutsche-boerse.com` |
|    ✅     | HEARTBEAT_INTERVAL_MS | Interval in milliseconds to send WebSocket ping frames to keep connection alive | number |         |            `30000`             |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                     Options                      | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [lwba](#lwba-endpoint), [price](#price-endpoint) | `lwba`  |

## Lwba Endpoint

`lwba` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |       Aliases        |                  Description                   |  Type  |             Options              | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------------: | :--------------------------------------------: | :----: | :------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |  isin  | `ISIN`, `instrument` | The ISIN identifier of the instrument to query | string |                                  |         |            |                |
|    ✅     | market |       `stream`       |  The market identifier of the stream to query  | string | `md-tradegate`, `md-xetraetfetp` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "lwba",
    "market": "md-xetraetfetp",
    "isin": "IE00B53L3W79"
  }
}
```

---

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? |  Name  |       Aliases        |                  Description                   |  Type  |             Options              | Default | Depends On | Not Valid With |
| :-------: | :----: | :------------------: | :--------------------------------------------: | :----: | :------------------------------: | :-----: | :--------: | :------------: |
|    ✅     |  isin  | `ISIN`, `instrument` | The ISIN identifier of the instrument to query | string |                                  |         |            |                |
|    ✅     | market |       `stream`       |  The market identifier of the stream to query  | string | `md-tradegate`, `md-xetraetfetp` |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "market": "md-xetraetfetp",
    "isin": "IE00B53L3W79"
  }
}
```

---

MIT License
