---
'@chainlink/gsr-adapter': patch
---

Fix hourly WebSocket disconnections caused by access token expiry.

A GSR session stops delivering data one hour after it is opened, and GSR neither closes the socket nor sends any notice. The adapter had no way to know, so the only thing that noticed was the framework's staleness check at `WS_SUBSCRIPTION_UNRESPONSIVE_TTL` (120s). By then cached prices had aged out at `CACHE_MAX_AGE` (90s), so every cycle ended in a burst of 504s. In production this repeated on a 62 minute period — 60 minutes of data, plus 120 seconds to notice.

Two changes, one for each half of that:

- The adapter now reads `validUntil` from the token response and, five minutes ahead of expiry, renews the token in place via GSR's `PUT /token` endpoint (removed in #2459, restored here) rather than waiting to be cut off. If renewal is refused it reconnects immediately instead, still ahead of expiry.
- `WS_SUBSCRIPTION_UNRESPONSIVE_TTL` now defaults to 30s for this adapter. The token travels in the WebSocket handshake, so a successful renewal is not proof the session survived; this keeps the framework's own liveness check inside `CACHE_MAX_AGE`, so a stall from a renewal that did not take — or from any other cause — is caught and reconnected while cached prices are still being served. Operators can still override it via the environment.
