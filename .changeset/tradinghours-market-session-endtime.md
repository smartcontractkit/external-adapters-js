---
'@chainlink/tradinghours-adapter': minor
---

Add `endTime` to each `market-session` transition (additive passthrough of the upstream phase `end`), so callers can derive the start of closed spans (weekends/holidays), and widen the hours-multiday query window from `[now-1d, now+1d]` to `[now-5d, now+1d]` so the last phase before a multi-day closure stays in reach. See `docs/adr/0001-market-session-exposes-phase-end-times.md`.
