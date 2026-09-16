---
'@chainlink/dxfeed-adapter': patch
---

Fix stale WS subscriptions being unsubscribed when the same ticker is still desired by another set of request params, and bump ea-framework to 2.20.0
