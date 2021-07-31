# Chainlink External Adapter for Finnhub

This external adapter is used to connect to [Finnhub's](https://finnhub.io/docs/api) API for stock data.

## Input Params

- `base`, `asset` or `from`: The target currency to query (required)
- `endpoint`: The endpoint to call (optional)

## Output Format

```json
{
 "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
 "data": {
  "c": 244.59,
  "h": 258.25,
  "l": 244.3,
  "o": 250.75,
  "pc": 246.88,
  "t": 1585143000,
  "result": 244.59
 },
 "result": 244.59,
 "statusCode": 200
}
```
