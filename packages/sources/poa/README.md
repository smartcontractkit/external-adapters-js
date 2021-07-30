# Chainlink External Adapter for POA Network gas price

### Input Params

| Required? |  Name   |             Description             |              Options               | Defaults to |
| :-------: | :-----: | :---------------------------------: | :--------------------------------: | :---------: |
|    🟡     | `speed` | The symbol of the currency to query | `slow`,`standard`,`fast`,`instant` | `standard`  |

## Output Format

```json
{
  "jobRunID": "1",
  "data": {
    "health": true,
    "block_number": 10012606,
    "slow": 7.8,
    "standard": 9,
    "fast": 13,
    "instant": 14.3,
    "block_time": 13.392,
    "result": 13000000000
  },
  "result": 13000000000,
  "statusCode": 200
}
```
