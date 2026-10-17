---
'@chainlink/dxfeed-adapter': major
---

Migrate the dxfeed websocket transport from the legacy cometd endpoint to the dxLink protocol (OPDATA-9200). **Breaking:** `WS_API_ENDPOINT` must point at the dxLink endpoint — legacy cometd-path URLs and URLs with embedded `://user:pass@` credentials are rejected at startup, and `API_USERNAME`/`API_PASSWORD` are now required settings. Credentials move to the Basic `Authorization` header on the WS handshake. Same data and field coverage: both `stock_quotes` (Quote events) and `price` (Trade/TradeETH events) keep working from the single dxLink connection. The REST transport and quote symbol config are unchanged.
