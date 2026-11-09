---
'@chainlink/gsr-adapter': patch
---

Re-authenticate when GSR refuses a WebSocket session, and keep token request credentials out of failure logs.

GSR accepts the WebSocket handshake and then closes a session it will not serve, with code 1000 and reason `Bye`. Since 2.6.6 the transport reused the cached token on every reconnect, so the rejection repeated until the token entered its refresh margin — up to 55 minutes of no data after the provider recovered. Each new connection now requests a fresh token again, as it did before 2.6.6, while in-place renewal keeps a long-lived connection authenticated. A token requested within the last 30 seconds is reused, so a provider that keeps refusing sessions is not sent a token request on every reconnect.

A close reported by a connection that has already been replaced no longer clears the current connection's token renewal timer.

Token request failures are also reduced to the HTTP status and GSR's error text before they reach the logger, keeping the request body (API key, user ID, timestamp, and signature) out of the logs.
