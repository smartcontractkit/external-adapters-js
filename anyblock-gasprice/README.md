# Chainlink External Adapter for Anyblock Analytics Gas Price

## Input Params

- `speed`: The speed for gas price to get. Available choices:
  - `slow`
  - `standard` (default)
  - `fast`
  - `instant`
- `endpoint`: The endpoint to use (optional, default: latest-minimum-gasprice)

## Output Format

```json
{
  "jobRunID": "1",
  "data": {
    "health": true,
    "blockNumber": 10012565,
    "blockTime": 13.49748743718593,
    "slow": 7.590000233,
    "standard": 8.250000233,
    "fast": 12,
    "instant": 15.4,
    "result": 12000000000
  },
  "result": 12000000000,
  "statusCode": 200
}
```
