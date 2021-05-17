# Chainlink Defi Pulse Index Adapter

The adapter combines real-time DPI allocation data from on-chain with off-chain price sources in order to calculate an accurate price for the DPI.

## NOTICE

As explained before, this adapter makes use of some onchain data. The current implementation is fetching data directly from SetToken contracts (https://etherscan.io/address/0x78733fa5e70e3ab61dc49d93921b289e4b667093#code). Note that this implementation won't work in other networks unless we deploy a copy of the contract.

The correct implementation should use SetProtocol.js typed library instead to fetch data directly from the SetToken contract directly.
The ChainlinkAdapter.getAllocations(ISetToken \_setToken) should be reimplemented in JS in order to use it.

[Go to current Implementation](./src/index-allocations/index.ts)

## Configuration

The adapter takes the following environment variables:

| Required? |      Name       |                       Description                       | Options | Defaults to |
| :-------: | :-------------: | :-----------------------------------------------------: | :-----: | :---------: |
|    ✅     |    `RPC_URL`    | Blockchain RPC endpoint to get the needed on-chain data |         |             |
|           | `DEFAULT_QUOTE` |         Currency that the price will be fetched         |         |    `USD`    |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |   Name    |           Description           | Options | Defaults to |
| :-------: | :-------: | :-----------------------------: | :-----: | :---------: |
|    ✅     | `address` |     Address of the SetToken     |         |             |
|    ✅     | `adapter` | Address of the adapter contract |         |             |
|           |  `name`   |           Index name            |         |             |
|           |  `asset`  |           Asset name            |         |             |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "source": "coingecko",
    "address": "0x...",
    "adapter": "0x..."
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
      "YFI": {
        "quote": {
          "USD": {
            "price": "30728.51152684"
          }
        }
      },
      "COMP": {
        "quote": {
          "USD": {
            "price": "198.21970609"
          }
        }
      },
      "SNX": {
        "quote": {
          "USD": {
            "price": "13.51407837"
          }
        }
      },
      "MKR": {
        "quote": {
          "USD": {
            "price": "1226.46551940"
          }
        }
      },
      "REN": {
        "quote": {
          "USD": {
            "price": "0.64199191"
          }
        }
      },
      "KNC": {
        "quote": {
          "USD": {
            "price": "1.35595208"
          }
        }
      },
      "LRC": {
        "quote": {
          "USD": {
            "price": "0.38664748"
          }
        }
      },
      "BAL": {
        "quote": {
          "USD": {
            "price": "19.04491399"
          }
        }
      },
      "UNI": {
        "quote": {
          "USD": {
            "price": "8.19034913"
          }
        }
      },
      "AAVE": {
        "quote": {
          "USD": {
            "price": "183.52498799"
          }
        }
      }
    },
    "result": 207.478005723407
  },
  "result": 207.478005723407,
  "statusCode": 200
}
```
