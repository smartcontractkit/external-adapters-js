---
'@chainlink/galaxy-adapter': minor
---

Updated Galaxy WS EA to fetch access token if existing token is older than 30 seconds. Added fetchingToken check it avoid making many duplicated token requests. Added default env overrides
