---
'@chainlink/glv-token-adapter': patch
---

Re-request the GMX /markets and /tokens metadata when the on-chain GLV info references an address the cached metadata does not contain, instead of failing until the next scheduled refresh.
