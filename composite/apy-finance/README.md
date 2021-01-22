# Chainlink External Adapter to Calculate APY Finance TVL

The adapter calculates APY Finance total value locked

## Configuration

The adapter takes the following environment variables:

- `RPC_URL`: Blockchain RPC endpoint to get the needed on-chain data
- `REGISTRY_ADDRESS`: Address Registry contract address used to query the Chainlink Registry

This adapter relies on [`token-allocation`](../token-allocation/README.md) adapter. Required `token-allocation` input params and configuration apply to this adapter as well.

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "sources": [],
    "payload": {
      "DAI": {
        "quote": {
          "USD": {
            "price": "1.00750541"
          }
        }
      },
      "USDC": {
        "quote": {
          "USD": {
            "price": "0.99465161"
          }
        }
      },
      "USDT": {
        "quote": {
          "USD": {
            "price": "1.00064981"
          }
        }
      }
    },
    "result": 18469823.762145024
  },
  "result": 18469823.762145024,
  "statusCode": 200
}
```
