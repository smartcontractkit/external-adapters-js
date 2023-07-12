---
'@chainlink/finnhub-adapter': minor
'@chainlink/finnhub-secondary-adapter': minor
---

Fix Finnhub EA's WebSocket transports

Fixes an issue where Finnhub EA's would fail for certain requests when using WebSockets.
Previously Finnhub WebSocket requests would succeed for full symbols (e.g. {"base": "OANDA:EUR_USD"}), but fail for requests with separate base and quote (e.g. {"base": "EUR", "quote: "USD"}). This is because the WebSocket message returns a single symbol which is cached as the
base, and future requests included a quote so did not match the cached key.
This commit fixes the above by introducing a requestTransform for the endpoint. The requestTransform checks if the symbol is a full symbol (e.g. OANDA:EUR_USD), and if so discards any quote provided as only the base will be used anyway. This keeps the cache key consistent when
writing and reading for both REST and WS.
