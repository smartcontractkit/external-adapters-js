# Chainlink External Adapter for Marketchecks

## Input Params

- `endpoint`: Optional endpoint param. Default: `vehicle`

### Vehicle

- `year`: The vehicle year (required)
- `make`: The vehicle make (required)
- `model`: The vehicle model (required)

#### Output

```json
{
  "jobRunID": "1",
  "data": {
   ...,
    "result": 850000
  },
  "result": 850000,
  "statusCode": 200
}
```
