# Chainlink External Adapter for Live-Rates

## Input Params

- `base`, `from`, `symbol`, or `rate`: The symbol of the currency to query

## Output

```json
{
  "jobRunID": "1",
  "data": [
    {
      "currency": "BTC/USD",
      "rate": "23092.29",
      "bid": "23092.29",
      "ask": "23129.5",
      "high": "24091.6",
      "low": "21994.27",
      "open": "23452.12",
      "close": "23092.29",
      "timestamp": "1608593061337"
    }
  ],
  "result": 23092.29,
  "statusCode": 200
}
```
