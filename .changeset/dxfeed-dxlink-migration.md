---
'@chainlink/dxfeed-adapter': patch
---

Migrate the dxfeed websocket transport from the legacy cometd endpoint to the dxLink protocol (wss://tools.dxfeed.com/dxlink-chainlink). Same credentials (now sent as a Basic Authorization header on the WS handshake via API_USERNAME/API_PASSWORD), same data and field coverage. New required WS_API_ENDPOINT setting (the dxLink URL, validated at startup: legacy cometd paths and embedded credentials are rejected); both the price and stock_quotes endpoints keep working from the single dxLink connection.
