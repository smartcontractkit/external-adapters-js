# Chainlink Coinbase External Adapter

https://developers.coinbase.com/api/v2#prices

## Input Params

- `base`, `from`, `coin`: The coin to query (required)
- `quote`, `to`, `market`: The currency to convert to (required)

## Endpoint

```
https://api.coinbase.com/v2/prices/BTC-USD/spot
```

## Output

```json
{
  "data": {
    "amount": "1015.00",
    "currency": "USD"
  }
}
```
