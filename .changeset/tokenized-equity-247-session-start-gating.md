---
'@chainlink/tokenized-equity-adapter': minor
---

Add opt-in session-start gating to the 24/7 `issuer-price-247` endpoint (env-gated, default off): reports whose `lastSeenTimestampNs` predates the start of the session their `marketStatus` declares are rejected with 503 `PRE_SESSION(...)`; WEEKEND/closed-span reports gate against the end of the last trading phase before the gap. New env vars `ISSUER_247_SESSION_START_GATING_ENABLED` and `ISSUER_247_SESSION_GATING_FAIL_ON_INDETERMINATE_SESSION`. Also flattens the hard-coded fallback session schedule to a single per-market entry with per-phase end times (24/5 behavior unchanged), and parses the tradinghours `market-session` `endTime` passthrough. See `docs/issuer-247-session-start-gating-tdd.md` and `docs/adr/0007-247-session-start-gating-weekend-and-fail-closed.md`.
