## Known Issues

### CACHE_MAX_AGE interaction with Heartbeat messages

If `CACHE_MAX_AGE` is set below a current heartbeat interval (60000ms), the extended cache TTL feature for out-of-market-hours that relies on heartbeats will not work.
