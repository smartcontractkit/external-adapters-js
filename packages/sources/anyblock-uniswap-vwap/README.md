# Chainlink External Adapter for Anyblock Analytics

Service to calculate the volume weighted average price (VWAP) for any Uniswap asset

### Environment Variables

The adapter takes the following environment variables:

| Required? |   Name    |     Description      | Options | Defaults to |
| :-------: | :-------: | :------------------: | :-----: | :---------: |
|    ✅     | `API_KEY` | Bitex API key to use |         |             |

### Input Params

| Required? |    Name    |                    Description                     | Options | Defaults to  |
| :-------: | :--------: | :------------------------------------------------: | :-----: | :----------: |
|    ✅     | `address`  |         Uniswap pool **checksum address**          |         |              |
|           |  `debug`   |         Switch to show `raw` trade values          |         |   `false`    |
|           | `roundDay` | TSwitch to round the start and end to midnight UTC |         |   `false`    |
|           |  `start`   |             Epoch timestamp in seconds             |         | `$now - 24h` |
|           |   `end`    |             Epoch timestamp in seconds             |         |    `$now`    |

### Sample Input

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

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 299.2532855156056,
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
  "result": 299.2532855156056,
  "statusCode": 200
}
```
