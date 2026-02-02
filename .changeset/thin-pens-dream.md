---
'@chainlink/ondo-calculated-adapter': major
---

Read trading session from trading hours instead of hard-coded values

When upgrading to this version:

1.  Point TRADING_HOURS_ADAPTER_URL to a trading hours EA with minimum version of 0.6.0
2.  If you have DATA_ENGINE_EA_URL set, rename it to DATA_ENGINE_ADAPTER_URL
3.  Wait for CLL's go ahead message
