# Chainlink External Adapter for the Crypto Volatility Index (CVX)

## Overview

CVX is a decentralized volatility index created by COTI (https://coti.io) for the crypto markets

The CVX index calculation is based on the classic approach of the Black-Scholes option pricing model and is adapted to the current crypto-market conditions.

## Configuration

The CVX index calculation requires the following environment variables:

- `CMC_API_KEY`: An api key required for coinmarketcap (https://coinmarketcap.com/api/)

## Build and run

To build:
```bash
make docker adapter=crypto-volatility-index
```

To run:
```bash
docker run -p 8080:8080 -e CMC_API_KEY=<your coinmarketcap api key> -e LOG_LEVEL=debug crypto-volatility-index-adapter:latest
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
