---
'@chainlink/finnhub-adapter': minor
'@chainlink/finnhub-secondary-adapter': minor
---

Finnhub: Separate base, quote and exchange params.

- Separating the base, quote and exchange params allows us to maintain standardised inbound and DP requests.
- This fixes an issue where Finnhub EA's would fail for certain requests when using WebSockets. Previously Finnhub WebSocket requests would succeed for full symbols (e.g. {"base": "OANDA:EUR_USD"}), but fail for requests with separate base and quote (e.g. {"base": "EUR", "quote: "USD"}). This is because the WebSocket message returns a single symbol which is cached as the base, and future requests included a quote so did not match the cached key.
- This commit introduces a requestTransform for the Finnhub Quote endpoint, which splits full symbols into their constituent base, quote and exchange. We can the consistently build and destructure the symbols in our REST and WS transports. As part of this a new input parameter `exchange` is added, allowing requests to specify the exchange they wish to fetch data for.
