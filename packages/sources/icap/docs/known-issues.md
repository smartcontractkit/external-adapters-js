## Known Issues

### Concurrent connections

Context: TP and ICAP EAs use the same credentials, and often there are issues with the set of credentials not having concurrent (ie: 2+) connections enabled.

- With both TP and ICAP EAs off, try the following commands to check if this is the case:

```bash
wscat -c 'ws://json.mktdata.portal.apac.parametasolutions.com:12000'
```

- Once connected, send:

```json
{ "msg": "auth", "user": "USER_CRED", "pass": "API_KEY", "mode": "broadcast" }
```

- If credentials work for a single connection, open a second terminal and run the same commands while the first is still running. The expected behaviour is that both terminals should fire out a massive amount of price data.
