# Chainlink External Adapter for BTCD

## Configuration

The adapter takes the following environment variables:

- `API_ENDPOINT`: The URL for the BTCD JSON-RPC endpoint
- `CHAIN`: The chain this BTCD node uses. Defaults to "mainnet".
- `COIN`: The coin this BTCD node uses. Defaults to "btc".

## Input Params

- `endpoint`: Optional endpoint param, defaults to `balance`

### Balance endpoint

- `dataPath`: Optional path where to find the addresses array, defaults to `result`
- `confirmations`: Optional confirmations param, defaults to `6`

- `addresses`: Addresses to query

  {

  - `address`: Address to query
  - `coin`: Optional currency to query, defaults to `btc`
  - `chain`: Optional chain to query, defaults to `mainnet`

  }

## Output

```json
{}
```
