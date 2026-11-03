---
'@chainlink/dxfeed-adapter': major
---

Migrate the dxFeed WS transport from cometd to dxLink (OPDATA-9200).

- `WS_API_ENDPOINT` must be the dxLink URL. There is no default; Partnerships supply the value.
- Credentials move out of the URL into `API_USERNAME` / `API_PASSWORD`, sent as the HTTP Basic auth header on the WS handshake. A URL with embedded credentials is rejected at startup.
- `stock_quotes` keeps `data.mid_price`, `data.bid_price`, `data.ask_price`, `data.bid_volume`, and `data.ask_volume`; `result` now carries the same mid price (it was `null`).
- The WS price transport subscribes `Trade` and `TradeETH` for every symbol and serves the record with the newest provider time.
- The REST transport and its environment variables are unchanged.

### NOP upgrade

This is a breaking deployment change. Before upgrading:

1. Change `WS_API_ENDPOINT` from the legacy cometd URL to the dxLink URL provided by Partnerships. Do not leave the old cometd path in place.
2. Remove any `user:pass@` credentials from `WS_API_ENDPOINT`.
3. Set `API_USERNAME` and `API_PASSWORD` to the same dxFeed credentials the cometd feed used. The adapter sends them as `Authorization: Basic ...`.
4. Restart the adapter. A stale cometd URL will not connect, and a URL with embedded credentials is rejected at startup.

No other environment variables change.
