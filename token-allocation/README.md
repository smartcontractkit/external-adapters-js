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

- `components`: Array of the token symbols. 
- `units` (optional): Array of balances of each token in ETH. 1 ether for each token by default.
- `currency` (optional). Currency we want the price on. `DEFAULT_CURRENCY` by default

`units[n]` would correspond to the `components[n]` balance

```json
{
  "jobID": "1",
  "data": {
    "components": [
      "DAI",
      "USDC"
    ],
    "units": [
      "1",
      "20"
    ]
  }
}
```

## Output
```json
{
  "jobRunID": "1",
  "data": {
    "result": 21.0120259020486,
    "index": [
      {
        "asset": "DAI",
        "units": "1",
        "currency": "USD",
        "price": 1.0009618237296
      },
      {
        "asset": "USDC",
        "units": "20",
        "currency": "USD",
        "price": 1.00055320391595
      }
    ]
  },
  "result": 21.0120259020486,
  "statusCode": 200
}
```
