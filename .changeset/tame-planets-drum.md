---
'@chainlink/dxfeed-adapter': patch
---

Fix stale WS subscriptions being unsubscribed when the same ticker is still desired by another set of request params
