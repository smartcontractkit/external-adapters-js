---
'@chainlink/tokenized-equity-adapter': patch
---

Alert-facing logging for session-start gating schedule failures (24/5 and 24/7): a distinct error line (`Market schedule undetermined: …`) now discriminates the two no-schedule-tier causes — an invalid market session name (unknown `sessionMarketType`) vs. no fallback schedule entry for the market — which previously surfaced only as an unattributed 503 `Session start unknown`. A malformed tradinghours schedule (unparseable phase `time`/`endTime`) is now rejected whole and lands in the existing `TradingHoursEA request failed` line instead of silently propagating NaN timestamps. The 24/7 gate gains the 24/5 fallback-activation warn (fetched schedule has no transition opening the report's session). No gating behavior change.
