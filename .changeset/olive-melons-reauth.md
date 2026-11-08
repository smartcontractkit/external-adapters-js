---
'@chainlink/gsr-adapter': patch
---

Re-authenticate when GSR refuses a WebSocket session, and keep token request credentials out of failure logs.

GSR accepts the WebSocket handshake and then closes a session it will not serve, with code 1000 and reason `Bye`. The transport kept reusing the cached token on every reconnect, so the rejection repeated until the token entered its refresh margin — up to 55 minutes of no data after the provider recovered. A session that closes without delivering a ticker now discards the cached token so the next connection mints a fresh one. Forced re-authentication happens at most once every 30 seconds, so a provider that keeps refusing fresh tokens is not sent a token request on every reconnect.

A close reported by a connection that has already been replaced no longer clears the current connection's token renewal timer.

Token request failures are also reduced to the HTTP status and GSR's error text before they reach the logger, keeping the request body (API key, user ID, timestamp, and signature) out of the logs.
