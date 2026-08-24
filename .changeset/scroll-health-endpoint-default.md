---
'@chainlink/layer2-sequencer-health-adapter': patch
---

Remove default Scroll health endpoint (venus.scroll.io); the health endpoint check is now skipped unless SCROLL_HEALTH_ENDPOINT is explicitly set
