---
'@chainlink/data-engine-adapter': minor
'@chainlink/glv-token-adapter': minor
'@chainlink/gmx-tokens-adapter': minor
'@chainlink/gold-adapter': patch
'@chainlink/tokenized-equity-adapter': patch
---

Add generic getFeedData function that auto-detects report version from feedId and routes to the correct endpoint, enabling V11 support in glv-token and gmx-tokens adapters
