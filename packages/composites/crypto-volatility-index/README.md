# Chainlink composite adapter for the Crypto Volatility Index (CVI)

## Overview

CVI is a decentralized volatility index created by COTI (https://coti.io) for the crypto markets

The CVI's calculation is based on the classic approach of the Black-Scholes option pricing model and is adapted to the current crypto-market conditions.

## Configuration

The CVI calculation requires the following environment variables:

This adapter relies on [`token-allocation`](../token-allocation/README.md) adapter.
Required `token-allocation` configuration apply to this adapter as well (no extra input params is required).

| Required? |                 Name                 |                       Description                       | Options | Defaults to |
| :-------: | :----------------------------------: | :-----------------------------------------------------: | :-----: | :---------: |
|    ✅     | `TOKEN_ALLOCATION_DATA_PROVIDER_URL` |  The location of a Token Allocation composite adapter   |         |             |
|    ✅     |              `RPC_URL`               | Blockchain RPC endpoint to get the needed on-chain data |         |             |

**The chosen data provider must support MarketCap.**

## Input Params

| Required? |             Name              |                                              Description                                              |                                                 Options                                                 |   Defaults to   |
| :-------: | :---------------------------: | :---------------------------------------------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------: | :-------------: |
|    ✅     |           `source`            |                                      The data provider to query                                       | `amberdata`, `coinapi`, `coingecko`, `coinmarketcap`, `coinpaprika`, `cryptocompare`, `kaiko`, `nomics` |                 |
|           |            `quote`            |                                  Currency that we want the price on.                                  |                                                                                                         | `DEFAULT_QUOTE` |
|    ✅     | `contractAddress`, `contract` |                The address of the on-chain crypto volatility index aggregator contract                |                                                                                                         |                 |
|           |          `heartBeat`          |                                    Address of the adapter contract                                    |                                                                                                         |      `180`      |
|           |          `heartBeat`          |          Multiply amount for the on-chain value, which also determines the result precision           |                                                                                                         |    `1000000`    |
|           |         `isAdaptive`          | Indicates whether the calculation result should be adaptively smoothed with its latest on-chain value |                                                                                                         |     `true`      |

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
