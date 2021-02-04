# Chainlink External Adapter for Marketstack

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `endpoint`: Optional endpoint param(default:eod)
- `interval`: The interval for the data (default: 1min)
- `limit`: The limit for number of results (default: 1)

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "pagination": { "limit": 1, "offset": 0, "count": 1, "total": 252 },
    "data": [
      {
        "open": 129.19,
        "high": 130.17,
        "low": 128.5,
        "close": 128.98,
        "volume": 100620880,
        "adj_high": 130.17,
        "adj_low": 128.5,
        "adj_close": 128.98,
        "adj_open": 129.19,
        "adj_volume": 100620880,
        "symbol": "AAPL",
        "exchange": "XNAS",
        "date": "2021-01-11T00:00:00+0000"
      }
    ],
    "result": 128.98
  },
  "result": 128.98,
  "statusCode": 200
}
```
