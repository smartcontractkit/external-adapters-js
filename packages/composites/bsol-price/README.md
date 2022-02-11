# Chainlink bSOL-price Composite Adapter

This EA pulls the price of bSOL/USD. It works by querying multiple Solana contracts to derive the price of bSOL/stSOL, fetching the price of stSOL/USD from a source data provider and finally multiplying the two to arrive at a price for bSOL/USD. Internally it uses two other EAs namely the `solana-view-function` and `token-allocation` external adapters.

## Configuration

The adapter takes the following environment variables:

| Required? |           Name            |                           Description                            | Options | Defaults to |
| :-------: | :-----------------------: | :--------------------------------------------------------------: | :-----: | :---------: |
|           |     `SOLIDO_ADDRESS`      |                The address of the Solido contract                |         |             |
|           |      `BSOL_ADDRESS`       |                 The address of the bSOL contract                 |         |             |
|           |      `STSOL_ADDRESS`      |                The address of the stSOL contract                 |         |             |
|           | `SOLIDO_CONTRACT_VERSION` | The Solido contract version that is deployed to `SOLIDO_ADDRESS` |         |             |

In addition to the environment variables mentioned in the table above, users must set the required environment variables for both the `solana-view-function` and `token-allocation` external adapters.

As of Feb 10th 2022, the addresses and the contract version for the environment variables above should be the following:

SOLIDO_ADDRESS: `EMtjYGwPnXdtqK5SGL8CWGv4wgdBQN79UPoy53x9bBTJ`
STSOL_ADDRESS: `BSGfVnE6q6KemspkugEERU8x7WbQwSKwvHT1cZZ4ACVN`
BSOL_ADDRESS: `3FMBoeddUhtqxepzkrxPrMUV3CL4bZM5QmMoLJfEpirz`
SOLIDO_CONTRACT_VERSION: 0

### Input Params

| Required? |   Name   |                                   Description                                    |                 Options                 | Defaults to |
| :-------: | :------: | :------------------------------------------------------------------------------: | :-------------------------------------: | :---------: |
|    ✅     | `source` | The data provider the Token Allocation EA should use to pull the stSOL/USD price | Refer to README for Token Allocation EA |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "source": "coingecko"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 129.10531993874667,
  "statusCode": 200,
  "data": {
    "result": 129.10531993874667
  }
}
```
