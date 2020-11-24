# Chainlink External Adapter for iv-outlier-detection

This adapter will fetch the value from GenesisVolatility and check the value difference against Derbit and the latest
on-chain answer. If difference surpasses the threshold for any, it will fail.

## Configuration

- `API_KEY`: Your API key for Genesis Volatility
- `RPC_URL`: ETH RPC URL to read the reference data value. Required by runlog requests or when metadata is not included.

Thresholds can be configured with the following env vars:

- `DIFF_ON_CHAIN_THRESHOLD`: Percentage threshold against on-chain answer. Default: 50
- `DIFF_DERBIT_THRESHOLD`: Percentage threshold against derbit value. Default: 30

## Input Params

- `base`, `from`, `coin` or `symbol`: The symbol of the currency to query
- `days` or `period`: The number of days to get the IV result from
- `referenceContract` or `contract`: The reference contract to get the on-chain value from (if no metadata is included)
- `multiply`: The multiply amount used by the reference contract

## Output

```json
{
   "jobRunID":"1",
   "data":{
      "result":60.1
   },
   "result":60.1,
   "statusCode":200
}
```
