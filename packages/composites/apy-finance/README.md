# Chainlink External Adapter to Calculate APY Finance TVL

The adapter calculates APY Finance total value locked

## Configuration

The adapter takes the following environment variables:

| Required? |        Name        |                       Description                       | Options | Defaults to |
| :-------: | :----------------: | :-----------------------------------------------------: | :-----: | :---------: |
|    ✅     |     `RPC_URL`      | Blockchain RPC endpoint to get the needed on-chain data |         |             |
|    ✅     | `REGISTRY_ADDRESS` |                                                         |         |             |
|           |  `DEFAULT_QUOTE`   |   Currency that the price will be fetched by default.   |         |    `USD`    |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "source": "coingecko"
  }
}
```

### Sample Output

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
