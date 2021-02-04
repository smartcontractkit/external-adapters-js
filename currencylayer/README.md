# Chainlink CurrencyLayer External Adapter

## Input Params:

- `base` or `from`: Specify the currency to convert from (required)
- `quote` or `to`: Specify the currency to convert to (required)
- `endpoint`: The endpoint to call (optional, defaults to convert)
- `amount`: Specify the amount to convert (optional)

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
