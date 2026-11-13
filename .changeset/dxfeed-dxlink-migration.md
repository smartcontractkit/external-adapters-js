---
'@chainlink/dxfeed-adapter': major
---

Migrate the dxFeed WS transport from cometd to dxLink (OPDATA-9200). `WS_API_ENDPOINT` must be the dxLink URL supplied by Partnerships; credentials move to `API_USERNAME` / `API_PASSWORD` and are sent as the HTTP Basic auth header. A URL with embedded credentials or the legacy cometd path is rejected. Equity quotes follow the EA data standard: zero, negative, one-sided and crossed quotes return 502 rather than a repaired mid; sizes are optional and null when absent. `stock_quotes` keeps `data.mid_price` from two valid sides and marks it `midSource: "computed"`. `price` uses `NumericResultEndpoint` and matches the incumbent subscription set: `:USLF24` tickers subscribe `Trade` + `TradeETH`, bare tickers subscribe `Trade` only. The REST transport is unchanged.

### NOP upgrade

Point `WS_API_ENDPOINT` at the dxLink URL, remove any `user:pass@` from it, set `API_USERNAME` / `API_PASSWORD`, and restart. No other environment variables change.
