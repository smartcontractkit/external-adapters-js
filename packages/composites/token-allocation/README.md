# Chainlink Token Allocation Price Adapter

The adapter calculates the total value in the currency selected for the selected tokens

## Configuration

The adapter takes the following environment variables:

To be functional at least one of the following underyling adapter locations will need to be provided.

| Required? |               Name                |                   Description                    | Options | Defaults to |
| :-------: | :-------------------------------: | :----------------------------------------------: | :-----: | :---------: |
|           |   `AMBERDATA_DATA_PROVIDER_URL`   |  The location of an Amberdata external adapter   |         |             |
|           |    `COINAPI_DATA_PROVIDER_URL`    |    The location of a CoinAPI external adapter    |         |             |
|           |   `COINGECKO_DATA_PROVIDER_URL`   |   The location of a CoinGecko external adapter   |         |             |
|           | `COINMARKETCAP_DATA_PROVIDER_URL` | The location of a CoinMarketCap external adapter |         |             |
|           |  `COINPAPRIKA_DATA_PROVIDER_URL`  |  The location of a CoinPaprika external adapter  |         |             |
|           | `CRYPTOCOMPARE_DATA_PROVIDER_URL` | The location of a CryptoCompare external adapter |         |             |
|           |     `KAIKO_DATA_PROVIDER_URL`     |     The location of a Kaiko external adapter     |         |             |
|           |    `NOMICS_DATA_PROVIDER_URL`     |    The location of a Nomics external adapter     |         |             |

Optionally the default behavior of the composite adapter can be configured

| Required? |       Name       |                     Description                     |       Options        | Defaults to |
| :-------: | :--------------: | :-------------------------------------------------: | :------------------: | :---------: |
|           | `DEFAULT_QUOTE`  | Currency that the price will be fetched by default. |                      |    `USD`    |
|           | `DEFAULT_METHOD` |         Method that will be used by default         | `price`, `marketCap` |   `price`   |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

## Input Params

| Required? |     Name      |                       Description                       |                                                 Options                                                 |                Defaults to                |
| :-------: | :-----------: | :-----------------------------------------------------: | :-----------------------------------------------------------------------------------------------------: | :---------------------------------------: |
|    ✅     |   `source`    |               The data provider to query                | `amberdata`, `coinapi`, `coingecko`, `coinmarketcap`, `coinpaprika`, `cryptocompare`, `kaiko`, `nomics` |                                           |
|           |    `quote`    |             Currency we want the price on.              |                                                                                                         | The `DEFAULT_QUOTE` environment variable  |
|           |   `method`    | Method we want the total value calculation be based on. |                                          `price`, `marketCap`                                           | The `DEFAULT_METHOD` environment variable |
|    ✅     | `allocations` |      Array of allocations, being each allocation:       |                                                                                                         |

<div align="center">

| Required |    Name    |  Description   | Default |
| :------: | :--------: | :------------: | :-----: |
|    ✅    |  `symbol`  |  Token symbol  |         |
|          | `balance`  | Token balance  | `1e18`  |
|          | `decimals` | Token decimals |  `18`   |

</div>

### Sample Input

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

### Sample Output

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
