# Chainlink Token Allocation Price Adapter

The adapter calculates the total value in the currency selected for the selected tokens

## Configuration

The adapter takes the following environment variables:

- `DATA_PROVIDER`: Data provider to use. Some of them require an `API_KEY`(K). Options available:
    - `amberdata` (K)
    - `coinapi`(K)
    - `coingecko`
    - `coinmarketcap`(K)
    - `coinpaprika`
    - `cryptocompare`
    - `kaiko` (K)
    - `nomics`(K)
- `API_KEY`: For those data providers who need an api key
- `DEFAULT_QUOTE` (Optional): Currency that the price will be fetched by default. `USD` used by default


## Input Params

- `allocations`: Array of allocations, being each allocation:
  - `symbol`: Token symbol
  - `balance` (optional): Token balance. `1e18` by default
  - `decimals` (optional): Token decimals. `18` by default
- `quote` (optional). Currency we want the price on. `DEFAULT_QUOTE` by default


```json
{
  "jobID": "1",
  "data": {
    "allocations": [
      {
        "symbol": "wBTC",
        "balance": 100000000,
        "decimals": 8
      },
      {
        "symbol": "DAI",
        "balance": "1000000000000000000"
      }
    ]
  }
}
```

## Output
```json
{
  "jobRunID": "1",
  "data": {
    "result": 37340.964000680404,
    "allocations": {
      "wBTC": {
        "quote": {
          "USD": {
            "price": 37339.963061228416
          }
        }
      },
      "DAI": {
        "quote": {
          "USD": {
            "price": 1.00093945198743
          }
        }
      }
    }
  },
  "result": 37340.964000680404,
  "statusCode": 200
}
```
