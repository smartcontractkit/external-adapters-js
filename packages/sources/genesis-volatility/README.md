# Chainlink External Adapter for Genesis Volatility

### Input Params

- `base`, `from`, `coin` or `symbol`: The symbol of the currency to query
- `key`, `result`, or `period`: The key to get the result from

| Required? |                Name                 |             Description             | Options | Defaults to |
| :-------: | :---------------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`, or `symbol` | The symbol of the currency to query |         |             |
|    ✅     |    `key`, `result`, or `period`     |   The key to get the result from    |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "ETH",
    "result": "oneDayIv"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "data": {
      "ChainlinkIv": [
        {
          "oneDayIv": 65.07,
          "twoDayIv": 69.29,
          "sevenDayIv": 70.53,
          "fourteenDayIv": 73.1,
          "twentyOneDayIv": 74.93,
          "twentyEightDayIv": 76.32
        }
      ]
    },
    "result": 76.32
  },
  "result": 76.32,
  "statusCode": 200
}
```
