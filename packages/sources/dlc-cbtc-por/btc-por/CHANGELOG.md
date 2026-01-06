# @chainlink/dlc-cbtc-btc-por-adapter

## 1.0.0

### Major Changes

- Initial release of the DLC CBTC Bitcoin Proof of Reserves adapter.
- Dynamically fetches vault addresses from the DLC.Link Attester API
- Independently calculates and verifies Taproot (P2TR) addresses using BIP32/Taproot derivation
- Queries Bitcoin blockchain UTXOs via Electrs-compatible API
- Implements confirmation-based UTXO filtering with configurable minimum confirmations
- Handles pending withdrawal transactions to prevent temporary reserve dips
