---
'@chainlink/calculated-price-adapter': patch
---

Require every successful source to report the decimals field and agree before scaling, so a single source can no longer dictate the scaling exponent while other sources omit it.
