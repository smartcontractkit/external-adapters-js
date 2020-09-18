# Chainlink External Adapter for Anyblock Analytics Offshift price feed

## Input Params

- `debug`: Switch to show `raw` trade values (optional, default: false)
- `roundDay` Switch to round the start and end to midnight UTC (optional, default: false)
- `start`: Epoch timestamp in seconds (optional, default: $now - 24h)
- `end`: Epoch timestamp in seconds (optional, default: $now)

## Output Format

```json5
{
 "jobRunID": "1",
 "data": {
  "result": {
   "volume": 3.447481508300616e+22,
   "vwap": 299.2532855156056
  },
  "raw": [
   {
    "timestamp": 1600304409,
    "reserve0": 1.3224814613263435e+23,
    "reserve1": 406170744097414250000
   },
   {
    // more raw values
   }
  ]
 },
 "result": {
  "volume": 3.447481508300616e+22,
  "vwap": 299.2532855156056
 },
 "statusCode": 200
}
```
