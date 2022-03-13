---
'@chainlink/anchor-adapter': major
---

- Update EA to use fixed point decimal operations to handle decimals in EA much like how decimals are handled in Solidity. This allows us to remove the extra dependency to the original BigNumbers JS library. A side effect of this is that the result is now returned in a string format with no decimals.
- Update EA to pull intermediary token prices from on chain Terra feeds instead of directly from data providers
