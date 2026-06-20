---
'@chainlink/blocksize-capital-adapter': minor
---

Add optional WebSocket subscription sharding. Set `WS_NUM_SHARDS` > 1 to spread
subscriptions across multiple connections — useful when the data provider has
a per-connection subscription cap. Default is 1 (single connection, same as
before).
