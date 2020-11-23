# Chainlink Defi Pulse Index Adapter

The adapter combines real-time DPI allocation data from on-chain with off-chain price sources in order to calculate an accurate price for the DPI.

## Configuration

The adapter takes the following environment variables:

- `RPC_URL`: Blockchain RPC endpoint to get the needed on-chain data
- `DATA_PROVIDER`: Data provider to use. Some of them require an `API_KEY`(K). Options available:
    - `coinapi`(K)
    - `coingecko`
    - `coinmarketcap`(K)
    - `coinpaprika`
    - `cryptocompare`
    - `nomics`(K)
- `API_KEY`: For those data providers who need an api key

## Input Params

- `name`: Index Name (optional)
- `asset`: Asset name (optional)
- `address`: Address of the SetToken (required)
- `adapter`: Address of the adapter contract (required)


## Output
```json
{
    "jobRunID": "1",
    "data": {
        "result": 106.83119866551249,
        "name": "DPI",
        "asset": "DPI",
        "address": "0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b",
        "adapter": "0x78733fa5e70e3ab61dc49d93921b289e4b667093",
        "index": [
            {
                "asset": "YFI",
                "units": "0.000639863431575122",
                "weight": 0,
                "priceData": {
                    "USD": 25256.08
                }
            },
            {
                "asset": "COMP",
                "units": "0.082679569392920759",
                "weight": 0,
                "priceData": {
                    "USD": 125.42
                }
            },
            {
                "asset": "SNX",
                "units": "2.702312600734526421",
                "weight": 0,
                "priceData": {
                    "USD": 5.274
                }
            },
            {
                "asset": "MKR",
                "units": "0.019413371198865064",
                "weight": 0,
                "priceData": {
                    "USD": 574.98
                }
            },
            {
                "asset": "REN",
                "units": "18.793919794675247046",
                "weight": 0,
                "priceData": {
                    "USD": 0.386
                }
            },
            {
                "asset": "KNC",
                "units": "4.219789253398933837",
                "weight": 0,
                "priceData": {
                    "USD": 1.089
                }
            },
            {
                "asset": "LRC",
                "units": "25.349336391802813884",
                "weight": 0,
                "priceData": {
                    "USD": 0.1998
                }
            },
            {
                "asset": "BAL",
                "units": "0.175076232830427677",
                "weight": 0,
                "priceData": {
                    "USD": 17.25
                }
            },
            {
                "asset": "REP",
                "units": "0.11048123024801992",
                "weight": 0,
                "priceData": {
                    "USD": 16.57
                }
            },
            {
                "asset": "UNI",
                "units": "4.332565485183901038",
                "weight": 0,
                "priceData": {
                    "USD": 3.894
                }
            },
            {
                "asset": "AAVE",
                "units": "0.227406077211030818",
                "weight": 0,
                "priceData": {
                    "USD": 71.46
                }
            }
        ]
    },
    "result": 106.83119866551249,
    "statusCode": 200
}
```
