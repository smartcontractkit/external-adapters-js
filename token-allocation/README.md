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

## Input Params

- `components`: Array of the token symbols. 
- `units`: Array of balances in wei of each token.
- `currency` (optional). Currency we want the price on. USD by default

`units[n]` would correspond to the `components[n]` balance

```json
{
	"jobID": "1",
    "data": {
        "components": [ "DAI", "USDC", "USDT" ],
        "units": ["1000000000000000000", "10000000000000000000", "1000000000000000000"]
    }
}
```

## Output
```json
{
    "jobRunID": "1",
    "data": {
        "result": 12.0322909,
        "index": [
            {
                "asset": "DAI",
                "units": "1",
                "currency": "USD",
                "price": "0.99985095"
            },
            {
                "asset": "USDC",
                "units": "10",
                "currency": "USD",
                "price": "1.00310470"
            },
            {
                "asset": "USDT",
                "units": "1",
                "currency": "USD",
                "price": "1.00139295"
            }
        ]
    },
    "result": 12.0322909,
    "statusCode": 200
}
```
