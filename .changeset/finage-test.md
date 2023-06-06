---
'@chainlink/finnhub-adapter': minor
---

Add `stock` and `forex` aliases for Finnhub EA.

- Adding `stock` and `forex` aliases for the existing `quote` endpoint.
- Feeds pull data from mutliple data providers using the same endpoint name, adding these alises allows feeds to pull stock and forex data from the Finnhub EA.
- Enables auto-generation for Finnhub EA README.
