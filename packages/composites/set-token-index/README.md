# Chainlink Set Token Index Adapter

The adapter combines allocation data from on-chain with off-chain price sources in order to calculate an accurate price.

## NOTICE

As explained before, this adapter makes use of some onchain data. The current implementation is fetching data directly from a SetToken contract. Note that this implementation won't work in other networks unless we deploy a copy of the contract.

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
  "result": 77.2904228488926,
  "statusCode": 200,
  "data": {
    "sources": [],
    "payload": {
      "LINK": {
        "quote": {
          "USD": {
            "price": 23.55965014968372
          }
        }
      },
      "RENFIL": {
        "quote": {
          "USD": {
            "price": 58.58848468608767
          }
        }
      },
      "GRT": {
        "quote": {
          "USD": {
            "price": 0.64488150175457
          }
        }
      },
      "BAT": {
        "quote": {
          "USD": {
            "price": 0.62484393253882
          }
        }
      },
      "LPT": {
        "quote": {
          "USD": {
            "price": 16.96103283121956
          }
        }
      },
      "OCEAN": {
        "quote": {
          "USD": {
            "price": 0.63431907164532
          }
        }
      },
      "NMR": {
        "quote": {
          "USD": {
            "price": 40.86539340005501
          }
        }
      }
    },
    "result": 77.2904228488926
  }
}
```
