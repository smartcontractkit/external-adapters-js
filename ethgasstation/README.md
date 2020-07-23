# Chainlink External Adapter for EthGasStation

## Input Params

- `speed`: The speed for gas price to get (required). Available choices:
    - `safeLow`
    - `average`
    - `fast`
    - `fastest`
- `endpoint`: The endpoint to use (optional, default: ethgasAPI)

## Output Format

```json
{
 "jobRunID": "1",
 "data": {
  "fast": 80,
  "fastest": 100,
  "safeLow": 10,
  "average": 10,
  "block_time": 14.767441860465116,
  "blockNum": 8714666,
  "speed": 0.6695499920593017,
  "safeLowWait": 1.7,
  "avgWait": 1.7,
  "fastWait": 0.5,
  "fastestWait": 0.5,
  "gasPriceRange": {
   "4": 246.1,
   "6": 246.1,
   "8": 246.1,
   "10": 1.7,
   "15": 1.2,
   "20": 1.1,
   "25": 1,
   "30": 0.9,
   "35": 0.9,
   "40": 0.7,
   "45": 0.7,
   "50": 0.7,
   "55": 0.7,
   "60": 0.7,
   "65": 0.7,
   "70": 0.7,
   "75": 0.7,
   "80": 0.5,
   "85": 0.5,
   "90": 0.5,
   "95": 0.5,
   "100": 0.5
  },
  "result": 80000000000
 },
 "result": 80000000000,
 "statusCode": 200
}
}
```
