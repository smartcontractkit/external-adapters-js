# Chainlink Defi Pulse Index Adapter

The adapter combines real-time DPI allocation data from on-chain with off-chain price sources in order to calculate an accurate price for the DPI.
## NOTICE

As explained before, this adapter makes use of some onchain data. The current implementation is fetching data directly from SetToken contracts (https://etherscan.io/address/0x78733fa5e70e3ab61dc49d93921b289e4b667093#code). Note that this implementation won't work in other networks unless we deploy a copy of the contract.

The correct implementation should use SetProtocol.js typed library instead to fetch data directly from the SetToken contract directly. 
The ChainlinkAdapter.getAllocations(ISetToken _setToken) should be reimplemented in JS in order to use it.

[Go to current Implementation](./src/index-allocations/index.ts)

## Configuration

The adapter takes the following environment variables:

- `DATA_PROVIDER_URL`: The adapter URL for the price data provider
- `RPC_URL`: Blockchain RPC endpoint to get the needed on-chain data
- `DEFAULT_QUOTE` (Optional): Currency that the price will be fetched by default. `USD` used by default

## Input Params

- `address`: Address of the SetToken (required)
- `adapter`: Address of the adapter contract (required)
- `name`: Index Name (optional)
- `asset`: Asset name (optional)
- `quote` (optional). Currency we want the price on. `DEFAULT_QUOTE` by default

## Output
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
