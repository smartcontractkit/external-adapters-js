# Chainlink External Adapter using Anyblock Analytics service to calculate the volume weighted average price (VWAP) for any Uniswap asset

You must provide the api key using the env variable `API_KEY`!

## Input Params

- `address`: Uniswap pool address (required)
- `debug`: Switch to show `raw` trade values (optional, default: false)
- `roundDay` Switch to round the start and end to midnight UTC (optional, default: false)
- `start`: Epoch timestamp in seconds (optional, default: \$now - 24h)
- `end`: Epoch timestamp in seconds (optional, default: \$now)

Uniswap Offshift (XTF) example:

```json
{
  "id": "1",
  "data": {
    "address": "0x2B9e92A5B6e69Db9fEdC47a4C656C9395e8a26d2",
    "debug": true
  }
}
```

## Output Format

```json
{
  "jobRunID": "1",
  "data": {
    "result": {
      "volume": 3.447481508300616e22,
      "vwap": 299.2532855156056
    },
    "raw": [
      {
        "timestamp": 1600304409,
        "reserve0": 1.3224814613263435e23,
        "reserve1": 406170744097414250000
      },
      {
        // more raw values
      }
    ]
  },
  "result": {
    "volume": 3.447481508300616e22,
    "vwap": 299.2532855156056
  },
  "statusCode": 200
}
```
