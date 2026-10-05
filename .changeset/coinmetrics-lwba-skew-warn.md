---
'@chainlink/coinmetrics-adapter': patch
'@chainlink/coinmetrics-lwba-adapter': patch
---

Log a warning when a CoinMetrics LWBA websocket snapshot violates bid ≤ mid ≤ ask. CoinMetrics can occasionally emit such skewed snapshots on thinner/volatile markets due to timing skew between the bid, mid, and ask updates. The snapshot is still passed through so the framework's LWBA output validation rejects it as before; this only adds an ingest-time log attributing the violation to the provider and asset.
