---
'@chainlink/coinmetrics-adapter': patch
---

Price WS: when the provider rejects the stream because an asset does not support a metric (`bad_parameters`, e.g. "Metric 'ReferenceRateBTC' … is not supported for 'win'"), leave out that asset while the stream has that metric, instead of failing every subscription.
