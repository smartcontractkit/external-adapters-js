# Chainlink Market Closure composite adapter

Market Closure composite adapter adds an extra check to see if trading is halted or not for the asset that's queried. It
allows for multiple checks and multiple price data provider. If the check provider fails, it will automatically fall
back to checking the schedule. If the market is closed, the adapter will fetch the latest on-chain value from the
reference contract.

## Configuration

The adapter takes the following environment variables:

- `CHECK_TYPE`: Required check type: `schedule|tradinghours`
- `PRICE_ADATER`: Required price data provider adapter type `finnhub|fcs_api`
- `CHECK_API_KEY`: Optional API key used by the check
- `RPC_URL`: ETH RPC URL to read the reference data value. Required by runlog requests.

## Run

First build the project:

```bash
yarn build
```

Then run the adapter.

Examples of combinations include:

Tradinghours & Finnhub:

```bash
env \
  LOG_LEVEL=debug \
  CHECK_TYPE=tradinghours \
  PRICE_ADATER=finnhub \
  API_KEY=your-finnhub-api-key \
  CHECK_API_KEY=your-tradinghours-api-key \
  yarn start
```

Schedule & FCS API:

```bash
env \
  LOG_LEVEL=debug \
  CHECK_TYPE=schedule \
  PRICE_ADATER=fcs_api \
  API_KEY=your-fcs_api-api-key \
  yarn start
```
