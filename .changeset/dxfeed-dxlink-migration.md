---
'@chainlink/dxfeed-adapter': minor
---

Migrate the dxFeed WS transport from cometd to dxLink (OPDATA-9200). Credentials move out of the URL into the Basic auth header, and `WS_API_ENDPOINT` rejects embedded credentials. Trade and TradeETH are subscribed for every symbol. The REST transport is unchanged.
