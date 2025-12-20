## Known Issues

### Concurrent connections

Context: Often there are issues with the set of credentials not having concurrent (ie: 2+) connections enabled.

- With all EA instances off, try the following commands to check if this is the case:

```bash
wscat -c 'ws://json.mktdata.portal.apac.parametasolutions.com:12000'
```

- Once connected, send:

```json
{ "msg": "auth", "user": "USER_CRED", "pass": "API_KEY", "mode": "broadcast" }
```

- If credentials work for a single connection, open a second terminal and run the same commands while the first is still running. The expected behaviour is that both terminals should fire out a massive amount of price data.

### CACHE_MAX_AGE interaction with Heartbeat messages

If `CACHE_MAX_AGE` is set below a current heartbeat interval (60000ms), the extended cache TTL feature for out-of-market-hours that relies on heartbeats will not work.
