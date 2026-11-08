---
'@chainlink/gsr-adapter': patch
---

Re-authenticate when GSR refuses a WebSocket session, and keep token request credentials out of failure logs.

GSR accepts the WebSocket handshake and then closes a session it will not serve about a second later, with code 1000 and reason `Bye`. The transport kept reusing the cached token on every reconnect, so the rejection repeated until the token entered its refresh margin — up to 55 minutes of no data after the provider recovered. A close that arrives before the session has delivered a ticker, or with `Bye`, now discards the cached token so the next connection mints a fresh one.

Token request failures are also reduced to the HTTP status before they reach the logger, keeping the request body (API key, user ID, timestamp, and signature) out of the logs.
