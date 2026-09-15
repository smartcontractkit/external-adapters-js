---
'@chainlink/mobula-state-adapter': patch
---

Trim includes.json to only entries used by live feeds. Remove 244 of 250 entries, keeping only the 6 that are actively depended on by live feeds/streams with mobula-state as a provider but no jobspec override.
