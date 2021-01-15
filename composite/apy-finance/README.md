# Chainlink External Adapter to Calculate APY Finance TVL

The adapter calculates APY Finance total value locked 


## Configuration

The adapter takes the following environment variables:

- `RPC_URL`: Blockchain RPC endpoint to get the needed on-chain data
- `REGISTRY_ADDRESS`: Address Registry contract address used to query the Chainlink Registry

This adapter relies on [`token-allocation`](../../token-allocation/README.md) adapter. Required `token-allocation` input params and configuration apply to this adapter as well.

## Output

```json
{
    "jobRunID": "1",
    "data": {
        "result": 4292798.933109738,
        "index": [
            {
                "asset": "DAI",
                "units": "4293438.870162793971",
                "currency": "USD",
                "price": "0.99985095"
            },
            {
                "asset": "USDC",
                "units": "0.000007849783550851",
                "currency": "USD",
                "price": "1.00310470"
            },
            {
                "asset": "USDT",
                "units": "0.000002663750518631",
                "currency": "USD",
                "price": "1.00139295"
            }
        ]
    },
    "result": 4292798.933109738,
    "statusCode": 200
}
```
