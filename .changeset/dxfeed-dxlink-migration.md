---
'@chainlink/dxfeed-adapter': patch
---

Migrate the dxfeed websocket transport from the legacy cometd endpoint to the dxLink protocol (wss://tools.dxfeed.com/dxlink-chainlink). Same credentials (now sent as a Basic Authorization header on the WS handshake via API_USERNAME/API_PASSWORD), same data and field coverage. New WS_API_ENDPOINT setting (the dxLink URL, validated at startup: legacy cometd paths and embedded credentials are rejected; ws:// loopback hosts are accepted with a warning for local test bridges). API_USERNAME, API_PASSWORD and WS_API_ENDPOINT are required for websocket requests; REST-only deployments boot without them. Both the price and stock_quotes endpoints keep working from the single dxLink connection.
