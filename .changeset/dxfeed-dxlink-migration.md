---
'@chainlink/dxfeed-adapter': minor
---

Migrate the dxfeed websocket transport from the legacy cometd protocol to the vendor's dxLink protocol (OPDATA-9200): `stock_quotes` and `price` keep working from the single dxLink connection with identical data and field coverage, `WS_API_ENDPOINT` must point at the dxLink endpoint (legacy cometd-path URLs and URLs with embedded credentials are rejected), and the REST transport is unchanged.
