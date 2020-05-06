# Chainlink External Adapter for Etherchain

## Input Params

- `endpoint`: The endpoint to use (optional, default: gasPriceOracle)
- `speed`: The speed for gas price to get (optional, default: fast)

## Output Format

```json
{
 "jobRunID": "1",
 "data": {
  "safeLow": "7.0",
  "standard": "8.3",
  "fast": "13.0",
  "fastest": "15.0",
  "result": 13000000000
 },
 "result": 13000000000,
 "statusCode": 200
}
```
