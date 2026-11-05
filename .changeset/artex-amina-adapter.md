---
'@chainlink/artex-amina-adapter': minor
---

Add the ARTEX/AMINA Proof of Reserve adapter (OPDATA-9410). The adapter authenticates to AMINA, pages through portfolio positions, and publishes the configured ISIN's raw share count as SmartData v9 `aum`. It returns `ripcord=0` and zero for the blank v9 NAV and fee fields. A missing or duplicate ISIN returns 502 and writes no report. The stream configuration owns `decimals`, `expiresAt`, and `feedId`.
