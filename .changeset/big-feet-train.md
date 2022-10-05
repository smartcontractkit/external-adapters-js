---
'@chainlink/bob-adapter': major
---

Moved BOB adapter to source adapters. RPC_URL environment variable is now required and has no defaults. Added CHAIN_ID environment variable and validation for connecting to blockchain endpoints. **WARNING:** Before upgrading, ensure the default CHAIN_ID value is correct for the chain(s) you use. If not, you need to explicitly set this env var. Please refer to the individual adapter README for more information.
