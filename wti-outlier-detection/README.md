# Chainlink External Adapter for WTI outlier detection

This adapter will fetch the value from XBTO and check the value difference against OilpriceAPI. If difference surpasses 
the threshold, it will fail and return the current on-chain value.

## Configuration

- `OILPRICEAPI_API_KEY`: Your API key for OilpriceAPI
- `XBTO_API_KEY`: Your API key for XBTO
- `RPC_URL`: ETH RPC URL to read the reference data value. Required by runlog requests.

Thresholds can be configured with the following env vars:

- `DIFF_OILPRICEAPI_THRESHOLD`: Percentage threshold against OilpriceAPI value. Default: 10

## Input Params

- `referenceContract` or `contract`: The reference contract being used
- `multiply`: The multiply amount for this reference contract

## Output

```json
{
   "jobRunID":"1",
   "data":{
      "result":45.97296
   },
   "result":45.97296,
   "statusCode":200
}
```
