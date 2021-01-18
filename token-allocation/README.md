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
- `DEFAULT_CURRENCY` (Optional): Currency that the price will be fetched by default. `USD` used by default


## Input Params

- `allocations`: Array of allocations, being each allocation:
  - `symbol`: Token symbol
  - `units` (optional): Token balance. `1e18` by default
  - `decimals` (optional): Token decimals. `18` by default
  - `currency` (optional). Currency we want the price on. `DEFAULT_CURRENCY` by default


```json
{
  "jobID": "1",
  "data": {
    "allocations": [
      {
        "symbol": "wBTC",
        "balance": 100000001,
        "decimals": 8
      },
      {
        "symbol": "DAI",
        "balance": 1000000000000
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
    "result": 36221.40305171679,
    "index": [
      {
        "asset": "wBTC",
        "currency": "USD",
        "units": "1.00000001",
        "price": 36221.40268850176
      },
      {
        "asset": "DAI",
        "currency": "USD",
        "units": "0.000001",
        "price": 1.00100698793125
      }
    ]
  },
  "result": 36221.40305171679,
  "statusCode": 200
}
```
