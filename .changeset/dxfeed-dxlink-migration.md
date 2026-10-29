---
'@chainlink/dxfeed-adapter': major
---

Migrate the dxFeed WS transport from cometd to dxLink (OPDATA-9200). Credentials move out of the URL into the Basic auth header, and `WS_API_ENDPOINT` rejects embedded credentials. Trade and TradeETH are subscribed for every symbol. The REST transport is unchanged.

### Upgrade steps for NOPs

1. Set `WS_API_ENDPOINT` to the private dxLink endpoint supplied by partnerships. There is no default.
2. Move the dxFeed username and password from the URL into `API_USERNAME` and `API_PASSWORD`.
3. Remove any `user:pass@` from `WS_API_ENDPOINT`; the adapter rejects it at startup.
4. Restart the adapter. REST-routed requests continue to use `API_ENDPOINT`.
