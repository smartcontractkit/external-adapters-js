# Chainlink composite adapter for the Crypto Volatility Index (CVI)

## Overview

CVI is a decentralized volatility index created by COTI (https://coti.io) for the crypto markets

The CVI's calculation is based on the classic approach of the Black-Scholes option pricing model and is adapted to the current crypto-market conditions.

## Configuration

The CVI calculation requires the following environment variables:

- `RPC_URL`: Blockchain RPC endpoint to get the needed on-chain data

This adapter relies on [`token-allocation`](../token-allocation/README.md) adapter.
Required `token-allocation` configuration apply to this adapter as well (no extra input params is required).
**The chosen data provider must support MarketCap.**

## Input Params

| Required? |             Name              |                                              Description                                              | Options |   Defaults to    |
| :-------: | :---------------------------: | :---------------------------------------------------------------------------------------------------: | :-----: | :--------------: |
|    ✅     | `contractAddress`, `contract` |                The address of the on-chain crypto volatility index aggregator contract                |         |                  |
|           |          `heartBeat`          |                                       Interval between updates                                        |         |       `60`       |
|           |          `multiply`           |          Multiply amount for the on-chain value, which also determines the result precision           |         |      `1e18`      |
|           |         `isAdaptive`          | Indicates whether the calculation result should be adaptively smoothed with its latest on-chain value |         |      `true`      |
|           |      `cryptoCurrencies`       |                             which curencies to use to calculate the index                             |         | `['BTC', 'ETH']` |
|           |     `deviationThreshold`      |                                the threshold for smoothing calculation                                |         |      `0.11`      |
|           |          `lambdaMin`          |                          Lambda min value for adaptive smoothing calculation                          |         |     `0.031`      |
|           |           `lambdaK`           |                           Lambda K value for adaptive smoothing calculation                           |         |      `0.31`      |

## Build and run

To build:
```bash
make docker adapter=crypto-volatility-index
```

To run:
```bash
docker run -p 8080:8080 -e RPC_URL=<rpc url, for example https://mainnet.infura.io/v3/infura_key> -e DOMINANCE_PROVIDER=coingecko -e LOG_LEVEL=debug crypto-volatility-index-adapter:latest
```


## Output

```json
{
 "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
 "data": {
  "result": 67.4
 },
 "statusCode": 200
}
```
