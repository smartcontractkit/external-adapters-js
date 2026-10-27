---
'@chainlink/tokenized-equity-adapter': minor
---

Add a session-switch gate that withholds price observations until the expected session's report has a `lastSeenTimestampNs` at or after that session's scheduled start. This rejects pre-open warm-up data and reports from a previous session (including the overnight and weekend boundaries) before they reach the chain. Adds an optional `sessionWeekend` input for the 24/5 closure window.
