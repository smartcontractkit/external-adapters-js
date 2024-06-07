---
'@chainlink/set-token-index-adapter': major
---

Critical fix to return allocation balances in the underlyng tokens decimal precision, rather than always 18 decimals.

The on-chain adapter contract e.g. ethereum:0x78733fa5e70e3ab61dc49d93921b289e4b667093, returns token allocations in a normalised 18 decimal format,
even for non 18 decimal format tokens.

This change makes the EA now handle this appropriately.

Previously it would make non 18 decimal tokens report USD balances which were shifted by multiple order of magnitudes 10^(18-tokenDecimals).
