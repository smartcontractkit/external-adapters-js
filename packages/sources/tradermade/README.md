# Chainlink External Adapter for Tradermade

## Endpoints

- `live` and `forex`. Use `forex` when querying for currency pairs. WebSockets can be enabled when fetching data from the `forex` endpoint but not the `live` endpoint. Adapter defaults to the `live` endpoint.

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `to`: The symbol of the currency to convert to (for FX)
- `overrides`: (not required) If base provided is found in overrides, that will be used. [Format](../../core/bootstrap/src/lib/external-adapter/overrides/presetSymbols.json)

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

## Sample Input to fetch currency data from the forex endpoint

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
