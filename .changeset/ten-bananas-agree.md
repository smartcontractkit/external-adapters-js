---
'@chainlink/por-address-list-adapter': minor
---

This EA supports multi chain. To add another chain, include two new env variable {NETWORK}\_RPC_URL and {NETWORK}\_RPC_CHAIN_ID. Then use contractAddressNetwork in param to select the chain. If there is no match, it will default to RPC_URL and CHAIN_ID. For example, BINANCE_RPC_URL and BINANCE_RPC_CHAIN_ID can be selected by "contractAddressNetwork": "binance"
