# Chainlink External Adapter to Synthetix Index Value

The adapter calculates a Synthetix Index value in the currency selected

## Configuration

- `DEFAULT_NETWORK` (Optional). Network to fetch the Synth Index
- `DATA_PROVIDER`: Data provider to use. Options (Notes):
  - amberdata (Doesn't support crypto quotes)
  - coinapi
  - coingecko
  - coinmarketcap
  - coinpaprika
  - cryptocompare
  - kaiko
  - nomics
- `API_KEY`: For those data providers who need an api key
- `DEFAULT_QUOTE` (Optional): Currency that the price will be fetched by default. `USD` used by default

E.g. if we wish to use CoinMarketCap as data provider, we should run (docker):
```
docker run -p 8080:8080 -e DATA_PROVIDER=coinmarketcap -e API_KEY=xxx-xxx -it synth-index-adapter:latest
```

## Input Params

- `base`, `asset` or `from`: Synthx Index asset to fetch
- `network` (optional): Network to fetch. `mainnet` by default
- `quote` (optional). Currency we want the price on. `DEFAULT_QUOTE` by default


```json
{
  "jobID": "1",
  "data": {
    "base": "sDEFI"
  }
}
```

## Output

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
