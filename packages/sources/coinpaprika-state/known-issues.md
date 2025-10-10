# Known Issues

## Streaming Data

### Streaming Method Selection: Multiple Assets via POST (Sessionless)

Per the "EA Requirements – Coinpaprika State" doc, Coinpaprika offers:

1. **Single Asset via GET** — simple but requires one connection per pair
2. **Multiple Assets via POST (Sessionless)** — ✅ **SELECTED APPROACH**
3. **Multiple Assets via Session** — requires session management overhead

### Streaming Data Response

> Numeric values may arrive as **strings**; the adapter coerces them to numbers and skips malformed JSON frames.

Example streaming event:

```
event: t_s
data: {"block_time": 1756224311, "base_token_symbol": "LUSD", "quote_symbol": "USD", "state_price": "1.0005", "volume_7d_usd": "1234.56", "market_depth_plus_1_usd": "0", "market_depth_minus_1_usd": "0"}
```

### Connection Management

- **Single Connection**: One SSE connection handles all requested pairs
- **Dynamic Reconnection**: Reconnects automatically when the pair set changes
- **Backoff Strategy**: Uses exponential backoff with jitter for reconnection attempts
- **Graceful Shutdown**: Properly closes connections and cleans up resources

### Error Handling

- **Malformed JSON**: Skips invalid JSON frames and continues processing
- **Provider Errors**: Maps HTTP status codes appropriately (500 → 502, etc.)
- **Connection Errors**: Automatic reconnection with backoff strategy
- **Missing Data**: Returns 504 when no data is available for requested pairs
