# Chainlink External Adapter for Amberdata gas price

## Input Params

- `speed`: The speed for gas price to get (optional, default: fast)
- `endpoint`: The blockchain id to get gas prices from (optional, default: ethereum-mainnet)

## Output Format

```json
{
 "jobRunID": "1",
 "data": {
  "status": 200,
  "title": "OK",
  "description": "Successful request",
  "payload": {
   "average": {
    "gasPrice": 8600000000,
    "numBlocks": 15,
    "wait": 3.5
   },
   "fast": {
    "gasPrice": 14000000000,
    "numBlocks": 3,
    "wait": 0.5
   },
   "fastest": {
    "gasPrice": 15000000000,
    "numBlocks": 3,
    "wait": 0.5
   },
   "safeLow": {
    "gasPrice": 7800000000,
    "numBlocks": 59,
    "wait": 14.1
   }
  },
  "result": 14000000000
 },
 "result": 14000000000,
 "statusCode": 200
}
```
