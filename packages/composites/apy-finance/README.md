# Chainlink External Adapter to Calculate APY Finance TVL

The adapter calculates APY Finance total value locked

## Configuration

The adapter takes the following environment variables:

To be functional the location of a running Token Allocation composite adapter must be configured.

| Required? |                 Name                 |                       Description                       | Options | Defaults to |
| :-------: | :----------------------------------: | :-----------------------------------------------------: | :-----: | :---------: |
|    ✅     | `TOKEN_ALLOCATION_DATA_PROVIDER_URL` |  The location of a Token Allocation composite adapter   |         |             |
|    ✅     |              `RPC_URL`               | Blockchain RPC endpoint to get the needed on-chain data |         |             |
|    ✅     |          `REGISTRY_ADDRESS`          |                                                         |         |             |

Optionally the default behavior of the composite adapter can be configured

| Required? |      Name       |                     Description                     | Options | Defaults to |
| :-------: | :-------------: | :-------------------------------------------------: | :-----: | :---------: |
|           | `DEFAULT_QUOTE` | Currency that the price will be fetched by default. |         |    `USD`    |

## Input Params

| Required? |   Name   |             Description             |                                                 Options                                                 |   Defaults to   |
| :-------: | :------: | :---------------------------------: | :-----------------------------------------------------------------------------------------------------: | :-------------: |
|    ✅     | `source` |     The data provider to query      | `amberdata`, `coinapi`, `coingecko`, `coinmarketcap`, `coinpaprika`, `cryptocompare`, `kaiko`, `nomics` |                 |
|           | `quote`  | Currency that we want the price on. |                                                                                                         | `DEFAULT_QUOTE` |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "source": "coingecko"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "sources": [],
    "payload": {
      "DAI": {
        "quote": {
          "USD": {
            "price": "1.00750541"
          }
        }
      },
      "USDC": {
        "quote": {
          "USD": {
            "price": "0.99465161"
          }
        }
      },
      "USDT": {
        "quote": {
          "USD": {
            "price": "1.00064981"
          }
        }
      }
    },
    "result": 18469823.762145024
  },
  "result": 18469823.762145024,
  "statusCode": 200
}
```
