---
'@chainlink/tokenized-equity-adapter': patch
---

DF-28181: add consumer-side stream freshness (staleness) gating. New optional env config family `DS_VALID_MAX_AGE_SECONDS` (+ `_REGULAR`/`_EXTENDED`/`_OVERNIGHT` overrides); when set, reports older than the threshold are rejected with 503 instead of being published. Disabled by default.

Also adds pre-open warm-up (session-start) gating behind `DS_SESSION_START_GATING_ENABLED` (default false): when enabled, a report whose `lastSeenTimestampNs` predates the start of the current session (per the tradinghours market-session schedule) is rejected with 503; fails closed when the session start cannot be determined.
