---
'@chainlink/mobula-state-adapter': patch
---

Fix: Gracefully handle unresolvable symbols and add case-insensitive request handling.

1. **Graceful Error Handling**: The adapter now returns `undefined` instead of throwing errors when symbols cannot be resolved to asset IDs in `getAssetId()` and `getQuoteId()`. The subscription message builder skips subscriptions for unresolvable symbols with a warning, preventing the EA from failing to establish WebSocket connections due to background processing errors.

2. **Case-Insensitive Requests**: Added `requestTransforms` to uppercase `base` and `quote` parameters and resolve them via `includes.json` before processing. This allows lowercase requests (e.g., `btc/usd`) to work seamlessly.
