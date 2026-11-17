---
'@chainlink/tradinghours-adapter': patch
---

`market-session`: `endTime` is now typed optional to match upstream (which omits `end` on some phases); a recognized phase missing its end logs an error (`market-session phase is missing its end time`) instead of silently emitting `endTime: undefined` against a required type. Consumers that derive closed-span (WEEKEND/holiday) starts from phase ends treat the schedule as missing ends and fall back to their hard-coded schedule.
