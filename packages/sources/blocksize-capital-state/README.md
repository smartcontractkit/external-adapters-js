# Chainlink External Adapter for Blocksize Capital State

### Environment Variables

| Required? |       Name        |          Description           | Options | Defaults to |
| :-------: | :---------------: | :----------------------------: | :-----: | :---------: |
|    ✅     |     `API_KEY`     |   API key for authentication   |         |             |
|    ✅     |      `TOKEN`      | Token for WebSocket connection |         |             |
|           | `WS_API_ENDPOINT` |   WebSocket API endpoint URL   |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                                    Options                                    | Defaults to |
| :-------: | :------: | :-----------------: | :---------------------------------------------------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint), [crypto](#Price-Endpoint), [state](#Price-Endpoint) |    price    |

---

## Price Endpoint

Returns real-time aggregated state price data for DEX tokens.

### Input Params

| Required? |  Name   |    Aliases     |                  Description                   |  Type  | Options  | Default |
| :-------: | :-----: | :------------: | :--------------------------------------------: | :----: | :------: | :-----: |
|    ✅     | `base`  | `from`, `coin` | The symbol of symbols of the currency to query | string |          |         |
|           | `quote` | `to`, `market` |    The symbol of the currency to convert to    | string | USD, ETH |   USD   |

### Sample Input

```json
{
  "data": {
    "endpoint": "state",
    "base": "CBBTC",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "result": 1234.56,
  "statusCode": 200,
  "data": {
    "result": 1234.56,
    "timestamp": 1672531200
  },
  "timestamps": {
    "providerDataRequestedUnixMs": 1641035471111,
    "providerDataReceivedUnixMs": 1641035471111,
    "providerIndicatedTimeUnixMs": 1672531200000
  }
}
```

## Technical Notes

### Timestamp Recording

The adapter preserves the provider's timestamp (`timestamp`, previously `block_time`) as `providerIndicatedTimeUnixMs` alongside Chainlink's processing timestamps for data traceability.

### Example Request

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"data": {"base": "ALETH", "quote": "USD", "endpoint": "state"}}'
```

### WebSocket Streaming Data Response

The adapter receives real-time data from Blocksize Capital in the following formats:

```json
{
  "jsonrpc": "2.0",
  "method": "state",
  "params": {
    "states": [
      {
        "timestamp": 1758026650,
        "base_symbol": "ALETH",
        "quote_symbol": "USD",
        "aggregated_state_price": "4412.262828",
        "aggregated_plus_1_percent_usd_market_depth": "0",
        "aggregated_minus_1_percent_usd_market_depth": "0",
        "aggregated_7d_usd_trading_volume": "2038012.966"
      }
    ]
  }
}
```

### Supported Assets

- `CBBTC` (Coinbase Wrapped BTC)
- `ALETH` (Alchemix ETH)
- `CBETH` (Coinbase Staked ETH)

The adapter connects to Blocksize Capital's WebSocket API to stream real-time aggregated state price data for supported DEX tokens. It supports both USD and ETH quote currencies.

---

MIT License
