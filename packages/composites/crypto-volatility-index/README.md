# Chainlink composite adapter for the Crypto Volatility Index (CVI)

## Overview

CVI is a decentralized volatility index created by COTI (https://coti.io) for the crypto markets

The CVI's calculation is based on the classic approach of the Black-Scholes option pricing model and is adapted to the current crypto-market conditions.

## Configuration

The CVI calculation requires the following environment variables:

| Required? |   Name    |                       Description                       | Options | Defaults to |
| :-------: | :-------: | :-----------------------------------------------------: | :-----: | :---------: |
|    ✅     | `RPC_URL` | Blockchain RPC endpoint to get the needed on-chain data |         |             |

**Additional environment variables must be set according to the Token Allocation adapter.**
This composite adapter executes the code from the Token Allocation composite adapter. As such the same configuration and input parameters apply to this adapter. See [../token-allocation/README.md](../token-allocation/README.md) for more details.

**The chosen data provider must support MarketCap.**

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |             Name              |                                              Description                                              | Options |   Defaults to    |
| :-------: | :---------------------------: | :---------------------------------------------------------------------------------------------------: | :-----: | :--------------: |
|    ✅     | `contractAddress`, `contract` |                The address of the on-chain crypto volatility index aggregator contract                |         |                  |
|           |          `heartBeat`          |                                    Address of the adapter contract                                    |         |       `60`       |
|           |          `heartBeat`          |          Multiply amount for the on-chain value, which also determines the result precision           |         |      `1e18`      |
|           |         `isAdaptive`          | Indicates whether the calculation result should be adaptively smoothed with its latest on-chain value |         |      `true`      |
|           |      `cryptoCurrencies`       |                             which curencies to use to calculate the index                             |         | `['BTC', 'ETH']` |
|           |     `deviationThreshold`      |                                the threshold for smoothing calculation                                |         |      `0.11`      |
|           |          `lambdaMin`          |                          Lambda min value for adaptive smoothing calculation                          |         |     `0.031`      |
|           |           `lambdaK`           |                           Lambda K value for adaptive smoothing calculation                           |         |      `0.31`      |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "source": "coingecko",
    "address": "0x..."
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": 67.4
  },
  "statusCode": 200
}
```
