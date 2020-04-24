# Chainlink EOD Historical Data External Adapter

## Input Params
- `asset`, `base`, `from` or `symbol`: The symbol to get the price from (required)
- `endpoint`: The endpoint to use (optional)


## Output

```json
{
   "jobRunID":"278c97ffadb54a5bbb93cfec5f7b5503",
   "data":{
      "code":"CL.COMM",
      "timestamp":1585167540,
      "gmtoffset":0,
      "open":24.37,
      "high":25.24,
      "low":22.91,
      "close":24.3,
      "volume":590048,
      "previousClose":24.01,
      "change":0.29,
      "change_p":1.208,
      "result":24.3
   },
   "result":24.3,
   "statusCode":200
}
```
