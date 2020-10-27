# Chainlink External Adapter for Amberdata

Gets the [latest spot VWAP price](https://docs.amberdata.io/reference#spot-price-pair-latest) from Amberdata.

## Input Params

- `base`, `from`, or `coin`: The asset to query
- `quote`, `to`, or `market`: The currency to convert to

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "status": 200,
  "title": "OK",
  "description": "Successful request",
  "payload": {
   "timestamp": 1603800660000,
   "pair": "link_usd",
   "price": "12.02087667",
   "volume": "508.31"
  },
  "result": 12.02087667
 },
 "result": 12.02087667,
 "statusCode": 200
}
```
