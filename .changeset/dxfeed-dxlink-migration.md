---
'@chainlink/dxfeed-adapter': major
---

Migrate the dxfeed websocket transport from the legacy cometd endpoint to the dxLink protocol (OPDATA-9200). **Breaking:** `WS_API_ENDPOINT` must point at the dxLink endpoint — the legacy cometd transport is deleted, and legacy cometd-path URLs and URLs with embedded `://user:pass@` credentials are rejected whenever `WS_API_ENDPOINT` is set. The WS settings (`WS_API_ENDPOINT`, `API_USERNAME`, `API_PASSWORD`) are not startup-required: they gate WS-path requests only, and a boot with none of them set keeps serving the unchanged REST transport. Credentials ride the Basic `Authorization` header on the WS handshake. Same data and field coverage: both `stock_quotes` (Quote events) and `price` (Trade/TradeETH events) keep working from the single dxLink connection. The REST transport and quote symbol config are unchanged.
