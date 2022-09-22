# Chainlink Defi-dozen Composite Adapter

## Configuration

**Environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../../non-deployable/token-allocation/README.md](../../non-deployable/token-allocation/README.md) for more details.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

**Additional environment input params must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../../non-deployable/token-allocation/README.md](../../non-deployable/token-allocation/README.md) for more details.

### Sample Input

```json
{
  "id": "1",
  "data": {
    "source": "coinmarketcap"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 35298.99851077005,
  "statusCode": 200,
  "data": {
    "sources": [],
    "payload": {
      "UNI": {
        "quote": {
          "USD": {
            "price": 20.509754531374618
          }
        }
      },
      "LINK": {
        "quote": {
          "USD": {
            "price": 27.217264320933708
          }
        }
      },
      "AAVE": {
        "quote": {
          "USD": {
            "price": 265.70665175995515
          }
        }
      },
      "GRT": {
        "quote": {
          "USD": {
            "price": 0.8993708849816983
          }
        }
      },
      "MKR": {
        "quote": {
          "USD": {
            "price": 2847.0521691613285
          }
        }
      },
      "COMP": {
        "quote": {
          "USD": {
            "price": 301.82761720395234
          }
        }
      },
      "SUSHI": {
        "quote": {
          "USD": {
            "price": 9.010604226485228
          }
        }
      },
      "SNX": {
        "quote": {
          "USD": {
            "price": 8.385971829948389
          }
        }
      },
      "YFI": {
        "quote": {
          "USD": {
            "price": 31799.15653662672
          }
        }
      },
      "BAT": {
        "quote": {
          "USD": {
            "price": 1.0054931999911176
          }
        }
      },
      "PERP": {
        "quote": {
          "USD": {
            "price": 14.2816854008598
          }
        }
      },
      "BNT": {
        "quote": {
          "USD": {
            "price": 3.945391623516949
          }
        }
      }
    },
    "result": 35298.99851077005
  }
}
```
