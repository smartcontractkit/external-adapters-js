# Chainlink External Adapter for Genesis Volatility

### Environment Variables

| Required? |  Name   |             Description             | Options | Defaults to |
| :-------: | :-----: | :---------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | Your API key for Genesis Volatility |         |             |

### Input Params

| Required? |                 Name                 |             Description             | Options | Defaults to |
| :-------: | :----------------------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, `coin`, or `symbol`  | The symbol of the currency to query |         |             |
|    ✅     | `days`, `key`, `result`, or `period` |   The key to get the result from    |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "coin": "ETH",
    "days": 1
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
    "result": 65.07
  },
  "result": 65.07,
  "statusCode": 200
}
```
