---
'@chainlink/tiingo-adapter': minor
---

stock_quotes requests with `assetType: indices` (e.g. us30usd) are now served from the Tiingo FX feed, returning mid/bid/ask with zero volume.
