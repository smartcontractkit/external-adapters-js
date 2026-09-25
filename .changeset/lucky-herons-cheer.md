---
'@chainlink/tokenized-equity-adapter': patch
---

Keep Kalman/EMA always fed the true raw price and generalize the raised-cosine transition to decay towards a caller-supplied target (the overnight EMA's price during the overnight session, the raw price otherwise), instead of handing the overnight EMA's price to the filter itself at either the entry or exit of the overnight session
