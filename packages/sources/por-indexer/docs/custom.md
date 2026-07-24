## Known Issues

### Dependencies

**Default (unchanged):** Bitcoin balances use a NOP-run **`bitcoin-por-indexer`** HTTP service. Set `BITCOIN_MAINNET_POR_INDEXER_URL` / `BITCOIN_TESTNET_POR_INDEXER_URL`.

**Opt-in streams indexer (mainnet only):** To use the shared BCY/streams Bitcoin indexer instead, set:

- `BITCOIN_MAINNET_USE_STREAMS_INDEXER=true`
- `BITCOIN_MAINNET_RPC_URL` to the Electrs-compatible base URL (same as `BITCOIN_RPC_ENDPOINT` in `dlc-cbtc-por`)

PoR jobspecs can stay on `indexer: por_indexer`; only the `por-indexer` EA deployment env vars change.

Dogecoin continues to use `DOGECOIN_*_POR_INDEXER_URL`.

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decided to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.
