# Chainlink Fixer External Adapter

This adapter is for [Fixer.io](https://fixer.io/) and supports the convert endpoint.

## Input Params

- `base` or `from`: The target currency to query (required)
- `quote` or `to`: The currency to convert to (required)
- `endpoint`: The endpoint to call (optional)
- `amount`: The amount to convert (optional)

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "success": true,
  "query": {
   "from": "GBP",
   "to": "JPY",
   "amount": 1
  },
  "info": {
   "timestamp": 1519328414,
   "rate": 148.972231
  },
  "historical": "",
  "date": "2018-02-22",
  "result": 148.972231
 },
 "result": 148.972231,
 "statusCode": 200
}
```
