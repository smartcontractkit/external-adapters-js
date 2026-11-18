---
'@chainlink/tradinghours-adapter': patch
---

`market-session`: `endTime` is now typed optional to match upstream (which omits `end` on some phases) and is only emitted when the upstream phase end is non-empty — an empty-string end previously passed through and parsed to NaN downstream, rejecting the whole schedule. A schedule with recognized phases missing their end logs one warning per parse (listing the phases) instead of one error per phase, since upstream omits `end` as a matter of course. Consumers that derive closed-span (WEEKEND/holiday) starts from phase ends treat phases without an end as having no end and fall back to their hard-coded schedule.
