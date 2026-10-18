---
'@chainlink/dxfeed-adapter': major
---

Migrate the dxfeed adapter's websocket transport from the vendor's legacy cometd protocol to the dxLink protocol (OPDATA-9200). The cometd transport (wss://tools.dxfeed.com/chainlink/cometd) is deleted and replaced by a dxLink websocket transport against wss://tools.dxfeed.com/dxlink-chainlink; the vendor confirms identical data and field coverage with unchanged credentials. This is a breaking change: WS_API_ENDPOINT must now be the clean dxLink URL — startup checks reject the legacy cometd path and URLs with embedded credentials, and API_USERNAME/API_PASSWORD are required and sent as a Basic auth header on the WS handshake instead of in the URL. Both websocket endpoints (stock_quotes and price) are served from the single dxLink connection; the REST transport is unchanged.
