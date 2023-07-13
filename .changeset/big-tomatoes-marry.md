---
'@chainlink/finnhub-adapter': minor
'@chainlink/finnhub-secondary-adapter': minor
---

Finnhub WS: Maintain reverse symbol mapping.

- Fixes an issue where Finnhub EA's would fail for certain requests when using WebSockets.
- Previously Finnhub WebSocket requests would succeed for full symbols (e.g. {"base": "OANDA:EUR_USD"}), but fail for requests with separate base and quote (e.g. {"base": "EUR", "quote: "USD"}). This is because the WebSocket message returns a single symbol which is cached as
  the base, and future requests included a quote so did not match the cached key.
- This commit fixes the above issue by using WebsocketReverseMappingTransport to be able to retrieve the original params once the WebSocket response is returned. This allows for a consistent cache key between requests and responses.
