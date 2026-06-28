---
'@chainlink/coinmarketcap-adapter': patch
---

Fix crypto transport attaching the full param list to every per-quote request, which caused intermittent 502 "Data for quote X not found" for any param whose quote differed from the request's convert.
