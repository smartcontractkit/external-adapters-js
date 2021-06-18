# Chainlink Vesper Composite Adapter

This adapter gets the total TVL from the Vesper pool in the controller.

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `RPC_URL` | Vesper _required_ parameter |         |             |
|   | `CONTROLLER_ADDRESS` | The Vesper controller address |         | `0xa4F1671d3Aee73C05b552d57f2d16d3cfcBd0217` |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

**Additional environment input params must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

### Sample Input

```json
{
  "id": "1",
  "data": {
    "quote": "USD",
    "source": "coinpaprika"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 761952596.3326263,
  "statusCode": 200,
  "data": {
    "sources": [],
    "payload": {
      "WETH": {
        "quote": {
          "USD": {
            "price": 2807.38
          }
        }
      },
      "WBTC": {
        "quote": {
          "USD": {
            "price": 39282
          }
        }
      },
      "USDC": {
        "quote": {
          "USD": {
            "price": 1
          }
        }
      },
      "DAI": {
        "quote": {
          "USD": {
            "price": 1
          }
        }
      },
      "VSP": {
        "quote": {
          "USD": {
            "price": 18.53
          }
        }
      },
      "LINK": {
        "quote": {
          "USD": {
            "price": 33.69
          }
        }
      }
    },
    "result": 761952596.3326263
  }
}
```
