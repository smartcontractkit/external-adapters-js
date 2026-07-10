---
'@chainlink/por-indexer-adapter': minor
---

Add opt-in streams Bitcoin indexer support for Bitcoin balances in `por-indexer`. Default behaviour remains the existing `bitcoin-por-indexer` HTTP path via `BITCOIN_*_POR_INDEXER_URL`. Enable BCY/streams UTXO queries by setting `BITCOIN_*_USE_STREAMS_INDEXER=true` and `BITCOIN_*_RPC_URL`. Preserves `minConfirmations` on the streams path.
