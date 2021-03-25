# Chainlink External Adapter to Synthetix Index Value

The adapter calculates a Synthetix Index value in the currency selected

## Configuration

The adapter takes the following environment variables:

To be functional the location of a running Token Allocation composite adapter must be configured.

| Required? |                 Name                 |                     Description                      | Options | Defaults to |
| :-------: | :----------------------------------: | :--------------------------------------------------: | :-----: | :---------: |
|           | `TOKEN_ALLOCATION_DATA_PROVIDER_URL` | The location of a Token Allocation composite adapter |         |             |

Optionally the default behavior of the composite adapter can be configured

| Required? |       Name        |                     Description                     | Options | Defaults to |
| :-------: | :---------------: | :-------------------------------------------------: | :-----: | :---------: |
|           | `DEFAULT_NETWORK` |    Network to fetch the Synth Index by default.     |         |  `mainnet`  |
|           |  `DEFAULT_QUOTE`  | Currency that the price will be fetched by default. |         |    `USD`    |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

## Input Params

| Required? |           Name            |             Description             |                                                 Options                                                 |    Defaults to    |
| :-------: | :-----------------------: | :---------------------------------: | :-----------------------------------------------------------------------------------------------------: | :---------------: |
|    ✅     |         `source`          |     The data provider to query      | `amberdata`, `coinapi`, `coingecko`, `coinmarketcap`, `coinpaprika`, `cryptocompare`, `kaiko`, `nomics` |                   |
|    ✅     | `base`, `asset` or `from` |     Synthx Index asset to fetch     |                                                                                                         |                   |
|    ✅     |         `network`         |     Synthx Index asset to fetch     |                                                                                                         | `DEFAULT_NETWORK` |
|    ✅     |          `quote`          | Currency that we want the price on. |                                                                                                         |  `DEFAULT_QUOTE`  |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "base": "sDEFI",
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
