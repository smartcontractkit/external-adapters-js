---
'@chainlink/dxfeed-adapter': minor
---

Migrate the dxFeed WebSocket transport from the decommissioned cometd endpoint (`wss://tools.dxfeed.com/chainlink/cometd`) to the dxLink protocol (`wss://tools.dxfeed.com/dxlink-chainlink`). Breaking env changes: `WS_API_ENDPOINT` must point at the dxLink endpoint (legacy `/chainlink/cometd` URLs and URL-embedded credentials are rejected at startup), and `API_USERNAME`/`API_PASSWORD` are now required for WS paths. REST transport and quote symbol config are unchanged.
