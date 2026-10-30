---
'@chainlink/tokenized-equity-adapter': patch
---

DF-28181: add consumer-side stream freshness (staleness) gating. New optional env config family `DS_VALID_MAX_AGE_SECONDS` (+ `_REGULAR`/`_EXTENDED`/`_OVERNIGHT` overrides); when set, reports older than the threshold are rejected with 503 instead of being published. Disabled by default.
