# Chainlink External Adapter for EthGasStation

## Input Params

- `endpoint`: The endpoint to use (optional, default: ethgasAPI)
- `speed`: The speed for gas price to get (required)

## Output Format

```json
{
 "jobRunID": "1",
 "data": {
  "fast": 135,
  "fastest": 143,
  "safeLow": 78,
  "average": 90,
  "block_time": 13.932203389830509,
  "blockNum": 10012598,
  "speed": 0.997887089651325,
  "safeLowWait": 19.9,
  "avgWait": 2.6,
  "fastWait": 0.5,
  "fastestWait": 0.5,
  "gasPriceRange": {
   "4": 232.2,
   "6": 232.2,
   "8": 232.2,
   "13": 232.2,
   "18": 232.2,
   "23": 232.2,
   "28": 232.2,
   "33": 232.2,
   "38": 232.2,
   "43": 232.2,
   "48": 232.2,
   "53": 232.2,
   "58": 232.2,
   "63": 232.2,
   "68": 232.2,
   "73": 232.2,
   "78": 19.9,
   "83": 8.5,
   "88": 5.6,
   "90": 2.6,
   "93": 2.4,
   "98": 2.1,
   "103": 1.1,
   "108": 1,
   "113": 0.9,
   "118": 0.9,
   "123": 0.8,
   "128": 0.8,
   "133": 0.5,
   "135": 0.5,
   "138": 0.5,
   "143": 0.5
  },
  "result": 13500000000
 },
 "result": 13500000000,
 "statusCode": 200
}
```
