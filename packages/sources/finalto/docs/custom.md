# Known Issues

## Quote Endpoint Response Structure

The quote endpoint returns a response with nested data structures and some redundant fields. Below is an example response:

```json
{
  "result": 272.04499999999996,
  "data": {
    "result": 272.04499999999996,
    "bid": 272.02,
    "mid": 272.04499999999996,
    "ask": 272.07,
    "mid_price": 272.045,
    "bid_price": 272.02,
    "bid_volume": 10000,
    "ask_price": 272.07,
    "ask_volume": 10000
  }
}
```

## Field Relationships

### Price Fields

- **`result`**, **`data.result`**, and **`data.mid`**: All three fields contain the same value, calculated as `(bid + ask) / 2` (simple arithmetic mean)
- **`data.mid_price`**: Contains the liquidity-weighted mid price, which differs from the simple arithmetic mean

### Redundant Fields

- **`data.bid`** = **`data.bid_price`** (same value)
- **`data.ask`** = **`data.ask_price`** (same value)

### Volume Fields

- **`data.bid_volume`**: Volume available at the bid price
- **`data.ask_volume`**: Volume available at the ask price
