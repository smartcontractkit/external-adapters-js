---
'@chainlink/gsr-adapter': patch
---

Fix hourly WebSocket disconnections by implementing token refresh logic. GSR issues 1-hour validity tokens, and the adapter now proactively refreshes tokens before expiry to prevent ungraceful server-side connection closures.
