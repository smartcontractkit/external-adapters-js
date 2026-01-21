---
'@chainlink/ice-adapter': minor
---

Add Last Value Persistence (LVP) support for off-market hours. The adapter now listens for NetDania's internal heartbeat events (fired every ~180 seconds when the connection to the data provider is confirmed alive) and uses these to extend cache TTLs for active subscriptions. This ensures cached prices remain available during off-market hours while also confirming the data provider connection is healthy. The heartbeat events stop automatically if the connection is lost, allowing stale prices to expire naturally.

The default `CACHE_MAX_AGE` has been increased to 300 seconds (5 minutes) to exceed the NetDania heartbeat interval, ensuring LVP functions correctly out of the box.
