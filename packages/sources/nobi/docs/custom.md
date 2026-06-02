## Additional Env Variables

These env vars are available to configure the amount of WebSocket transports and subscriptions per transport that the adapter will manage. The defaults should be sufficient for most use cases:

- `MAX_TRANSPORTS`: The maximum number of WebSocket transports to manage. Default is 10.
- `MAX_SUBSCRIPTIONS_PER_TRANSPORT`: The maximum number of currency pairs to route through a single transport before routing to the next one. Default is 100.
