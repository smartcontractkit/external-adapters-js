# Chainlink JSON-RPC Balance adapter

This adapter makes it easy to get balances of arbitrary addresses from BTCD or electrs nodes.

## Configuration

The adapter takes the following environment variables:

- `NODE_TYPE`: The type of Bitcoin node. Expects one of "electrs", "btcd".
- `CHAIN`: The chain it's using. Defaults to "mainnet".
- `COIN`: The coin it's using. Defaults to "btc".

This adapter also expects the same environment configuration variables as the
[json-rpc-adapter](../../json-rpc/README.md).

## Request input

- `dataPath`: Optional path where to find the addresses array, defaults to `result`
- `confirmations`: Optional confirmations param, defaults to `6`

- `addresses`: Addresses to query

  {

  - `address`: Address to query

  }
