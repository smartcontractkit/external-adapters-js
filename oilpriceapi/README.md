# Chainlink OilpriceAPI External Adapter

## Input Params
- `type`, `base`, `asset`, `from`: The type of oil to get the price from (required)
- `endpoint`: The endpoint to use (optional)


## Output

```json
{
   "jobRunID":"278c97ffadb54a5bbb93cfec5f7b5503",
   "data":{
      "status":"success",
      "data":{
         "price":26.71,
         "formatted":"$26.71",
         "currency":"USD",
         "code":"BRENT_CRUDE_USD",
         "created_at":"2020-03-25T14:10:00.424Z",
         "type":"spot_price"
      },
      "result":26.71
   },
   "result":26.71,
   "statusCode":200
}
```
