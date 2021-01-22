# Chainlink Token Allocation Price Adapter

The adapter calculates the total value in the currency selected for the selected tokens

## Configuration

The adapter takes the following environment variables:

- `DATA_PROVIDER`: Data provider to use
- `API_KEY`: For those data providers who need an api key
- `DEFAULT_QUOTE` (Optional): Currency that the price will be fetched by default. `USD` used by default
- `DEFAULT_METHOD` (Optional): Method that will be used. Accepts `price` and `marketCap`. `price` by default.

The data providers supported and their properties are as follows:
| Data Provider | API Key Required | Supports Price | Supports MarketCap | Notes                           |
|---------------|------------------|----------------|--------------------|---------------------------------|
| amberdata     | Yes              | Yes            | Yes                |                                 |
| coinapi       | Yes              | Yes            | No                 |                                 |
| coingecko     | No               | Yes            | Yes                |                                 |
| coinmarketcap | Yes              | Yes            | Yes                |                                 |
| coinpaprika   | No               | Yes            | Yes                |                                 |
| cryptocompare | Yes              | Yes            | Yes                |                                 |
| kaiko         | Yes              | Yes            | No                 | Crypto Quotes are not supported |
| nomics        | Yes              | Yes            | Yes                |                                 |

## Input Params

- `allocations`: Array of allocations, being each allocation:
  - `symbol`: Token symbol
  - `balance` (optional): Token balance. `1e18` by default
  - `decimals` (optional): Token decimals. `18` by default
- `quote` (optional). Currency we want the price on. `DEFAULT_QUOTE` by default
- `method` (optional). Method we want the total value calculation be based on. Accepts `price` and `marketCap`. `DEFAULT_QUOTE` by default

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
    ],
    "quote": "USD",
    "method": "price"
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
      "WBTC": {
        "quote": {
          "USD": {
            "price": "34148.75913338036"
          }
        }
      },
      "DAI": {
        "quote": {
          "USD": {
            "price": "1.000837177435277"
          }
        }
      }
    },
    "result": 34149.759970557796
  },
  "result": 34149.759970557796,
  "statusCode": 200
}
```
