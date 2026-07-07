---
'@chainlink/por-indexer-adapter': major
---

Replace bitcoin-por-indexer backend with streams Bitcoin indexer UTXO queries. Rename env vars from `BITCOIN_*_POR_INDEXER_URL` to `BITCOIN_*_RPC_URL`. Drop Dogecoin support. Preserve `minConfirmations` filtering.
