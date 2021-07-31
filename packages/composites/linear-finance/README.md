# Chainlink Linear Finance Composite Adapter

This adapter calculates an index value from the symbols and units as defined in the CSV file.

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |         Description          | Options | Defaults to |
| :-------: | :-------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `CSV_URL` | URL of where to fetch the CSV data. Can be external or local file. | `http(s)://*`, `file://*` |             |

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
    "source": "coingecko"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 1076.771252160094,
  "statusCode": 200,
  "data": {
    "sources": [],
    "payload": {
      "BTC": {
        "quote": {
          "USD": {
            "price": 40152
          }
        }
      },
      "ETH": {
        "quote": {
          "USD": {
            "price": 2560.4
          }
        }
      },
      "BNB": {
        "quote": {
          "USD": {
            "price": 366.5
          }
        }
      },
      "EOS": {
        "quote": {
          "USD": {
            "price": 5.18
          }
        }
      },
      "FIL": {
        "quote": {
          "USD": {
            "price": 73.84
          }
        }
      },
      "XTZ": {
        "quote": {
          "USD": {
            "price": 3.27
          }
        }
      },
      "YFI": {
        "quote": {
          "USD": {
            "price": 39040
          }
        }
      },
      "ATOM": {
        "quote": {
          "USD": {
            "price": 12.89
          }
        }
      },
      "UNI": {
        "quote": {
          "USD": {
            "price": 23.62
          }
        }
      },
      "BCH": {
        "quote": {
          "USD": {
            "price": 623.38
          }
        }
      },
      "TRX": {
        "quote": {
          "USD": {
            "price": 0.071464
          }
        }
      },
      "HT": {
        "quote": {
          "USD": {
            "price": 14.23
          }
        }
      },
      "CRO": {
        "quote": {
          "USD": {
            "price": 0.117678
          }
        }
      },
      "ZIL": {
        "quote": {
          "USD": {
            "price": 0.11064
          }
        }
      },
      "OKB": {
        "quote": {
          "USD": {
            "price": 14.44
          }
        }
      },
      "XLM": {
        "quote": {
          "USD": {
            "price": 0.335574
          }
        }
      },
      "ADA": {
        "quote": {
          "USD": {
            "price": 1.56
          }
        }
      },
      "DOT": {
        "quote": {
          "USD": {
            "price": 24.3
          }
        }
      },
      "ALGO": {
        "quote": {
          "USD": {
            "price": 1.04
          }
        }
      },
      "SNX": {
        "quote": {
          "USD": {
            "price": 9.86
          }
        }
      },
      "COMP": {
        "quote": {
          "USD": {
            "price": 332.85
          }
        }
      },
      "OMG": {
        "quote": {
          "USD": {
            "price": 5.22
          }
        }
      },
      "AAVE": {
        "quote": {
          "USD": {
            "price": 314.79
          }
        }
      },
      "VET": {
        "quote": {
          "USD": {
            "price": 0.111735
          }
        }
      },
      "BAT": {
        "quote": {
          "USD": {
            "price": 0.693424
          }
        }
      },
      "NEO": {
        "quote": {
          "USD": {
            "price": 49.81
          }
        }
      },
      "THETA": {
        "quote": {
          "USD": {
            "price": 8.96
          }
        }
      },
      "SUSHI": {
        "quote": {
          "USD": {
            "price": 9.09
          }
        }
      },
      "LTC": {
        "quote": {
          "USD": {
            "price": 173.51
          }
        }
      },
      "XRP": {
        "quote": {
          "USD": {
            "price": 0.872595
          }
        }
      },
      "ZRX": {
        "quote": {
          "USD": {
            "price": 0.914367
          }
        }
      },
      "MKR": {
        "quote": {
          "USD": {
            "price": 3154.16
          }
        }
      },
      "CELO": {
        "quote": {
          "USD": {
            "price": 2.54
          }
        }
      },
      "FTT": {
        "quote": {
          "USD": {
            "price": 34.09
          }
        }
      },
      "DOGE": {
        "quote": {
          "USD": {
            "price": 0.326882
          }
        }
      },
      "BTT": {
        "quote": {
          "USD": {
            "price": 0.00348951
          }
        }
      },
      "REN": {
        "quote": {
          "USD": {
            "price": 0.456528
          }
        }
      },
      "LINK": {
        "quote": {
          "USD": {
            "price": 25.1
          }
        }
      },
      "MTL": {
        "quote": {
          "USD": {
            "price": 2.16
          }
        }
      },
      "QTUM": {
        "quote": {
          "USD": {
            "price": 9.2
          }
        }
      },
      "DGB": {
        "quote": {
          "USD": {
            "price": 0.05863
          }
        }
      },
      "ONT": {
        "quote": {
          "USD": {
            "price": 0.941489
          }
        }
      },
      "ICX": {
        "quote": {
          "USD": {
            "price": 1.08
          }
        }
      },
      "KSM": {
        "quote": {
          "USD": {
            "price": 397.67
          }
        }
      },
      "LINA": {
        "quote": {
          "USD": {
            "price": 0.03371511
          }
        }
      },
      "XEM": {
        "quote": {
          "USD": {
            "price": 0.17226
          }
        }
      },
      "UMA": {
        "quote": {
          "USD": {
            "price": 12.28
          }
        }
      },
      "MIOTA": {
        "quote": {
          "USD": {
            "price": 1.12
          }
        }
      }
    },
    "result": 1076.771252160094
  }
}
```
