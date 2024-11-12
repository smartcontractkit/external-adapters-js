## Known Issues

### CACHE_MAX_AGE interaction with Heartbeat messages

If `CACHE_MAX_AGE` is set below a current heartbeat interval (120000ms), the extended cache TTL feature for out-of-market-hours in IEX endpoint that relies on heartbeats will not work.

### CACHE_MAX_AGE interaction with WS_SUBSCRIPTION_TTL

If the value of `WS_SUBSCRIPTION_TTL` is less than the value of `CACHE_MAX_AGE`, there will be stale values in the cache.
