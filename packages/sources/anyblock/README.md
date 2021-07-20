# Chainlink External Adapter for Anyblock Analytics

### Environment Variables

The adapter takes the following environment variables:

| Required? |   Name    |     Description      | Options | Defaults to |
| :-------: | :-------: | :------------------: | :-----: | :---------: |
|           | `API_KEY` | Bitex API key to use |         |             |

### Input Parameters

| Required? |    Name    |     Description     |                         Options                         | Defaults to |
| :-------: | :--------: | :-----------------: | :-----------------------------------------------------: | :---------: |
|           | `endpoint` | The endpoint to use | [vwap](#VWAP-Endpoint), [gasprice](#Gas-Price-Endpoint) |   `vwap`    |

---

## VWAP Endpoint

Service to calculate the volume weighted average price (VWAP) for any Uniswap asset

NOTE: requires an API key

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

---

## Gas Price Endpoint

### Input Params

| Required? |    Name    |    Description    |              Options               |        Defaults to        |
| :-------: | :--------: | :---------------: | :--------------------------------: | :-----------------------: |
|    🟡     |  `speed`   | The desired speed | `slow`,`standard`,`fast`,`instant` |        `standard`         |
|    🟡     | `endpoint` |                   |                                    | `latest-minimum-gasprice` |

### Output

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
