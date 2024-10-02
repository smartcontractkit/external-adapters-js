---
'@chainlink/tp-adapter': minor
---

Combined TP and ICAP EAs into a single EA and removed ICAP.URL must have query param appended as selector in bridge URL, eg: https://<tp-ea>:8080?streamName=icapThis change will save subscription costs as all data for both DPs is sent on 1 WS connection and each additional connection requires additional subscriptions (and cost).Should be backwards compatible for TP ONLY
