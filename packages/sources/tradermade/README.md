# Chainlink External Adapter for Tradermade

### Environment Variables

| Required? |    Name    |                                           Description                                           | Options | Defaults to |
| :-------: | :--------: | :---------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |  API_KEY   | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) |         |             |
|           | WS_API_KEY | An API key that can be obtained from [here](https://marketdata.tradermade.com/docs/restful-api) |         |             |

### Websocket support

This adapter has Websocket support for only the forex endpoint

---

### Input Parameters

| Required? |           Name            |                                                                   Description                                                                   |                   Options                    | Defaults to |
| :-------: | :-----------------------: | :---------------------------------------------------------------------------------------------------------------------------------------------: | :------------------------------------------: | :---------: |
|           |        `endpoint`         |                                                               The endpoint to use                                                               | [`live`](#Live), [`forex`](#Prices-Endpoint) |   `live`    |
|    ✅     | `base`, `from`, or `coin` |                                                       The symbol of the currency to query                                                       |                                              |             |
|           |        `overrides`        | If base provided is found in overrides, that will be used. [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json) |                                              |             |

## Live Endpoint

| Required? | Name |    Description     | Options | Defaults to |
| :-------: | :--: | :----------------: | :-----: | :---------: |
|           | `to` | The quote currency |         |             |

## Sample Input to fetch equity data

```json
{
  "id": "1",
  "data": {
    "base": "AAPL"
  }
}
```

## Output

```json
{
  "jobRunID": "1",
  "result": 153.605,
  "debug": {
    "staleness": 0,
    "performance": 0.611584299,
    "providerCost": 1
  },
  "statusCode": 200,
  "data": {
    "endpoint": "live",
    "quotes": [
      {
        "ask": 153.61,
        "bid": 153.6,
        "instrument": "AAPL",
        "mid": 153.605
      }
    ],
    "requested_time": "Fri, 03 Sep 2021 01:09:03 GMT",
    "timestamp": 1630631344,
    "result": 153.605
  }
}
```

## Live Endpoint

This endpoint supports WS

| Required? |                Name                |    Description     | Options | Defaults to |
| :-------: | :--------------------------------: | :----------------: | :-----: | :---------: |
|    ✅     | `quote`, `to`, `market`, `convert` | The quote currency |         |             |

## Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "forex",
    "base": "EUR",
    "quote": "USD"
  }
}
```

## Output

```json
{
  "jobRunID": "1",
  "result": 1.18824,
  "debug": {
    "staleness": 0,
    "performance": 0.428423221,
    "providerCost": 1
  },
  "statusCode": 200,
  "data": {
    "endpoint": "live",
    "quotes": [
      {
        "ask": 1.18825,
        "base_currency": "EUR",
        "bid": 1.18824,
        "mid": 1.18824,
        "quote_currency": "USD"
      }
    ],
    "requested_time": "Fri, 03 Sep 2021 01:09:45 GMT",
    "timestamp": 1630631386,
    "result": 1.18824
  }
}
```
