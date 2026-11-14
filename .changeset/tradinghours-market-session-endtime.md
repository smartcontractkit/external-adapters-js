---
'@chainlink/tradinghours-adapter': minor
---

Add `endTime` to each `market-session` transition (additive passthrough of the upstream phase `end`), so callers can derive the start of closed spans (weekends/holidays). See `docs/adr/0001-market-session-exposes-phase-end-times.md`.
