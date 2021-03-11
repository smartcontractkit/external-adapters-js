# Chainlink External Adapter for FCS API

## Input Params

- `asset`, `base`, `from`: The target currency to query (required)
- `endpoint`: The endpoint to use (optional)

## Output Format

```json
{
 "jobRunID": "1",
 "data": {
  "status": true,
  "code": 200,
  "msg": "Successfully",
  "response": [
   {
    "price": "5770.60",
    "high": "5770.60",
    "low": "5725.00",
    "chg": "-56.01",
    "chg_percent": "-0.96%",
    "dateTime": "2020-04-24 09:10:08",
    "id": "529",
    "name": "FTSE 100"
   }
  ],
  "info": {
   "server_time": "2020-04-24 09:10:58 UTC",
   "credit_count": 1
  },
  "result": 5770.6
 },
 "result": 5770.6,
 "statusCode": 200
}
```
