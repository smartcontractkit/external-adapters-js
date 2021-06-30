# Chainlink External Adapter to Synthetix Index Value

The adapter calculates a Synthetix Index value in the currency selected

## Configuration

| Required? |       Name        |                    Description                     | Options | Defaults to |
| :-------: | :---------------: | :------------------------------------------------: | :-----: | :---------: |
|           | `DEFAULT_NETWORK` |          Network to fetch the Synth Index          |         |  `mainnet`  |
|           |  `DEFAULT_QUOTE`  | Currency that the price will be fetched by default |         |    `USD`    |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

## Input Params

| Required? |           Name            |             Description             | Options |    Defaults to    |
| :-------: | :-----------------------: | :---------------------------------: | :-----: | :---------------: |
|    ✅     | `base`, `asset` or `from` |     Synthx Index asset to fetch     |         |                   |
|           |         `network`         |     Synthx Index asset to fetch     |         | `DEFAULT_NETWORK` |
|           |          `quote`          | Currency that we want the price on. |         |  `DEFAULT_QUOTE`  |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "source": "coingecko",
    "base": "sDEFI"
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
      "COMP": {
        "quote": {
          "USD": {
            "price": "192.23560377"
          }
        }
      },
      "MKR": {
        "quote": {
          "USD": {
            "price": "1285.07135635"
          }
        }
      },
      "AAVE": {
        "quote": {
          "USD": {
            "price": "173.18073267"
          }
        }
      },
      "UMA": {
        "quote": {
          "USD": {
            "price": "10.20122460"
          }
        }
      },
      "SNX": {
        "quote": {
          "USD": {
            "price": "13.62490473"
          }
        }
      },
      "REN": {
        "quote": {
          "USD": {
            "price": "0.68786796"
          }
        }
      },
      "UNI": {
        "quote": {
          "USD": {
            "price": "8.23570852"
          }
        }
      },
      "KNC": {
        "quote": {
          "USD": {
            "price": "1.26141751"
          }
        }
      },
      "CRV": {
        "quote": {
          "USD": {
            "price": "1.75094267"
          }
        }
      },
      "WNXM": {
        "quote": {
          "USD": {
            "price": "39.17240510"
          }
        }
      },
      "YFI": {
        "quote": {
          "USD": {
            "price": "30967.53680584"
          }
        }
      },
      "BAL": {
        "quote": {
          "USD": {
            "price": "20.15973056"
          }
        }
      }
    },
    "result": 6902.49494069292
  },
  "result": 6902.49494069292,
  "statusCode": 200
}
```
