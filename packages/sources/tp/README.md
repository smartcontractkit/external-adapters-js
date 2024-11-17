# TP

![1.8.5](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tp/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### Concurrent connections

Context: Often there are issues with the set of credentials not having concurrent (ie: 2+) connections enabled.

- With all EA instances off, try the following commands to check if this is the case:

```bash
wscat -c 'ws://json.mktdata.portal.apac.parametasolutions.com:12000'
```

- Once connected, send:

```json
{ "msg": "auth", "user": "USER_CRED", "pass": "API_KEY", "mode": "broadcast" }
```

- If credentials work for a single connection, open a second terminal and run the same commands while the first is still running. The expected behaviour is that both terminals should fire out a massive amount of price data.

### CACHE_MAX_AGE interaction with Heartbeat messages

If `CACHE_MAX_AGE` is set below a current heartbeat interval (60000ms), the extended cache TTL feature for out-of-market-hours that relies on heartbeats will not work.

## Environment Variables

| Required? |      Name       |         Description          |  Type  | Options |                           Default                           |
| :-------: | :-------------: | :--------------------------: | :----: | :-----: | :---------------------------------------------------------: |
|    ✅     | WS_API_USERNAME |   API user for WS endpoint   | string |         |                                                             |
|    ✅     | WS_API_PASSWORD | API password for WS endpoint | string |         |                                                             |
|           | WS_API_ENDPOINT |    Endpoint for WS prices    | string |         | `ws://json.mktdata.portal.apac.parametasolutions.com:12000` |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                      Options                                       | Default |
| :-------: | :------: | :-----------------: | :----: | :--------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#price-endpoint), [forex](#price-endpoint), [price](#price-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `commodities`, `forex`, `price`.

### Input Params

| Required? |    Name    |    Aliases     |                      Description                       |  Type  |  Options   | Default | Depends On | Not Valid With |
| :-------: | :--------: | :------------: | :----------------------------------------------------: | :----: | :--------: | :-----: | :--------: | :------------: |
|    ✅     |    base    | `coin`, `from` |     The symbol of symbols of the currency to query     | string |            |         |            |                |
|    ✅     |   quote    | `market`, `to` |        The symbol of the currency to convert to        | string |            |         |            |                |
|           | streamName |    `source`    |                TP ('TP') or ICAP ('IC')                | string | `IC`, `TP` |  `TP`   |            |                |
|           | sourceName |   `tpSource`   | Source of price data for this price pair on the stream | string |            |  `GBL`  |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "EUR",
    "quote": "USD",
    "streamName": "TP",
    "sourceName": "GBL"
  }
}
```

---

MIT License
