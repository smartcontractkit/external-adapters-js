# TRADINGECONOMICS

![3.0.21](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/tradingeconomics/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### CACHE_MAX_AGE interaction with Heartbeat messages

If `CACHE_MAX_AGE` is set below a current heartbeat interval (45000ms), the extended cache TTL feature for out-of-market-hours that relies on heartbeats will not work.

## Environment Variables

| Required? |       Name        |                      Description                      |  Type   | Options |                  Default                   |
| :-------: | :---------------: | :---------------------------------------------------: | :-----: | :-----: | :----------------------------------------: |
|           |   API_ENDPOINT    |          The HTTP URL to retrieve data from           | string  |         | `https://api.tradingeconomics.com/markets` |
|           |  WS_API_ENDPOINT  |           The WS URL to retrieve data from            | string  |         |    `wss://stream.tradingeconomics.com/`    |
|    ✅     |  API_CLIENT_KEY   |          The TradingEconomics API client key          | string  |         |                                            |
|    ✅     | API_CLIENT_SECRET |        The TradingEconomics API client secret         | string  |         |                                            |
|           |    WS_ENABLED     | Whether data should be returned from websocket or not | boolean |         |                  `false`                   |

---

## Data Provider Rate Limits

|     Name     | Requests/credits per second | Requests/credits per minute | Requests/credits per hour |                         Note                         |
| :----------: | :-------------------------: | :-------------------------: | :-----------------------: | :--------------------------------------------------: |
|   standard   |              1              |                             |            500            | http://api.tradingeconomics.com/documentation/Limits |
| professional |              1              |                             |            800            |                                                      |
|  enterprise  |              1              |                             |            100            |                                                      |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                                                 Options                                                                 | Default |
| :-------: | :------: | :-----------------: | :----: | :-------------------------------------------------------------------------------------------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [commodities](#stock-endpoint), [crypto](#price-endpoint), [forex](#price-endpoint), [price](#price-endpoint), [stock](#stock-endpoint) | `price` |

## Price Endpoint

Supported names for this endpoint are: `crypto`, `forex`, `price`.

### Input Params

| Required? | Name  |         Aliases         |                  Description                   |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :---: | :---------------------: | :--------------------------------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base  | `asset`, `coin`, `from` | The symbol of symbols of the currency to query | string |         |         |            |                |
|    ✅     | quote | `market`, `term`, `to`  |    The symbol of the currency to convert to    | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "EUR",
    "quote": "USD"
  }
}
```

<details>
<summary>Additional Examples</summary>

Request:

```json
{
  "data": {
    "endpoint": "price",
    "base": "EURUSD:CUR",
    "quote": "USD"
  }
}
```

</details>

---

## Stock Endpoint

Supported names for this endpoint are: `commodities`, `stock`.

### Input Params

| Required? | Name |                   Aliases                   |        Description        |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----------------------------------------: | :-----------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `asset`, `coin`, `from`, `symbol`, `ticker` | The stock ticker to query | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "stock",
    "base": "AAPL:US"
  }
}
```

---

MIT License
