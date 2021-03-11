# Chainlink External Adapter for LCX

## Price API

### Endpoint

https://rp.lcx.com/v1/rates/current/?coin=BTC&currency=USD

### Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query, one of `BTC` or `ETH` (required)
- `quote`, `to`, or `market`: The symbol of the currency to convert to, one of `USD` or `EUR` (required)
- `endpoint`: Optional endpoint param, defaults to `price`, one of `price`

### Output

```json
{
  "jobRunID": "1",
  "data": {
    "status": "SUCCESS",
    "message": "Reference Price for BTC",
    "data": { "Price": 13326.14 },
    "result": 13326.14
  },
  "result": 13326.14,
  "statusCode": 200
}
```
