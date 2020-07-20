# Chainlink External Adapter for [MetalsAPI](https://metals-api.com/documentation#convertcurrency)

## Input Params

- `base` or `from`: The symbol of the currency to query
- `quote` or `to`: The symbol of the currency to convert to
- `endpoint`: Optional endpoint param

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "success": true,
  "query": {
   "from": "XAU",
   "to": "USD",
   "amount": "1"
  },
  "info": {
   "timestamp": 1595252400,
   "rate": 1813.1957606105088
  },
  "historical": false,
  "date": "2020-07-20",
  "result": 1813.1957606105088,
  "unit": "per ounce"
 },
 "result": 1813.1957606105088,
 "statusCode": 200
}
```
