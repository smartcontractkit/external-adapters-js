---
'@chainlink/tiingo-adapter': patch
---

Add WS bad closure failover mechanism and IEX-specific WebSocket endpoints to Tiingo.

Abnormal WS closures (code != 1000) now trigger the failover counter, preventing the adapter from getting stuck on a broken secondary URL. IEX now has its own primary/secondary endpoint env vars (IEX_WS_API_ENDPOINT, IEX_SECONDARY_WS_API_ENDPOINT) since the redundant stack URL does not support IEX. The default primary/secondary attempt ratio is changed to 5:1.
