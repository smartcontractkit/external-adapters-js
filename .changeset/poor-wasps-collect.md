---
'@chainlink/layer2-sequencer-health-adapter': minor
---

Add requireTxFailure input param which has conditional defaults depending on the network. The default behavior is the same as before for all networks except Base, which now does not use a tx call as the final decider of health.
