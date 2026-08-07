---
'@chainlink/gsr-adapter': patch
---

Fix hourly WebSocket disconnections caused by access token expiry.

GSR issues tokens valid for one hour and stops sending data when one expires, without closing the socket. The framework only noticed after `WS_SUBSCRIPTION_UNRESPONSIVE_TTL` (120s) of silence, by which point cached prices had already aged out at `CACHE_MAX_AGE` (90s), producing roughly 30 seconds of 504s every hour.

The adapter now tracks token expiry and, five minutes ahead of it, renews the token in place via GSR's `PUT /token` endpoint rather than reconnecting. Because the token travels in the WebSocket handshake headers, a successful renewal is not by itself proof that the session survived, so the adapter verifies that data is still arriving shortly after the old expiry and reconnects if it is not. A refused renewal also falls back to reconnecting immediately. Either fallback happens while cached prices are still fresh, so callers see no failures.

`PUT /token` renewal, along with the signature format it requires, was removed in #2459 and is restored here.
