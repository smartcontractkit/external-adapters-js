---
'@chainlink/tiingo-adapter': minor
'@chainlink/tiingo-state-adapter': minor
---

Remove failover to the secondary websocket endpoint (`api.redundantstack.com`), which Tiingo no longer runs. Websocket transports now connect only to `WS_API_ENDPOINT`. `SECONDARY_WS_API_ENDPOINT`, `WS_URL_PRIMARY_ATTEMPTS` and `WS_URL_SECONDARY_ATTEMPTS` are removed and ignored if set.
