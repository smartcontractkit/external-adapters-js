# Chainlink Defi Pulse Index Adapter

The adapter combines real-time DPI allocation data from on-chain with off-chain price sources in order to calculate an accurate price for the DPI.

## Configuration

The adapter takes the following environment variables:

- `RPC_URL`: Blockchain RPC endpoint to get the needed on-chain data
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

## NOTICE

As explained before, this adapter makes use of some onchain data. The current implementation is fetching data directly from SetToken contracts (https://etherscan.io/address/0x78733fa5e70e3ab61dc49d93921b289e4b667093#code). Note that this implementation won't work in other networks unless we deploy a copy of the contract.

The correct implementation should use SetProtocol.js typed library instead to fetch data directly from the SetToken contract directly. 
The ChainlinkAdapter.getAllocations(ISetToken _setToken) should be reimplemented in JS in order to use it.

[Go to current Implementation](./src/index-allocations/index.ts)

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
        "result": 108.89030892698364,
        "name": "DPI",
        "asset": "DPI",
        "address": "0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b",
        "adapter": "0x78733fa5e70e3ab61dc49d93921b289e4b667093",
        "index": [
            {
                "asset": "YFI",
                "units": "0.000639863431575122",
                "price": 24712.77
            },
            {
                "asset": "COMP",
                "units": "0.082679569392920759",
                "price": 127.67
            },
            {
                "asset": "SNX",
                "units": "2.702312600734526421",
                "price": 5.459
            },
            {
                "asset": "MKR",
                "units": "0.019413371198865064",
                "price": 606.56
            },
            {
                "asset": "REN",
                "units": "18.793919794675247046",
                "price": 0.3748
            },
            {
                "asset": "KNC",
                "units": "4.219789253398933837",
                "price": 1.137
            },
            {
                "asset": "LRC",
                "units": "25.349336391802813884",
                "price": 0.206
            },
            {
                "asset": "BAL",
                "units": "0.175076232830427677",
                "price": 16.75
            },
            {
                "asset": "REP",
                "units": "0.11048123024801992",
                "price": 17.81
            },
            {
                "asset": "UNI",
                "units": "4.332565485183901038",
                "price": 4.171
            },
            {
                "asset": "AAVE",
                "units": "0.227406077211030818",
                "price": 70.18
            }
        ]
    },
    "result": 108.89030892698364,
    "statusCode": 200
}
```
