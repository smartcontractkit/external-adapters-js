---
'@chainlink/finage-adapter': patch
---

Fix streams adapter subscriptions stuck on 504 for CompositeTransport endpoints: writes from the ws and rest sub-transports now reach every subscription, whichever sub-transport it learned
