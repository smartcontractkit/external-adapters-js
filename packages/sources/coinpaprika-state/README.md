# COINPAPRIKA_STATE

The Coinpaprika State adapter streams **state_price** for supported pairs via **Server-Sent Events (SSE)** streaming.

---

## Environment Variables

|        Variable         | Description                                          |  Type  | Required |                       Default                       |
| :---------------------: | ---------------------------------------------------- | :----: | :------: | :-------------------------------------------------: |
|        `API_KEY`        | Coinpaprika API key (sent as `Authorization` header) | string |    ✅    |                          —                          |
|     `API_ENDPOINT`      | Coinpaprika streaming endpoint (POST)                | string |          | `https://chainlink-streaming.dexpaprika.com/stream` |
| `BACKGROUND_EXECUTE_MS` | Background loop interval for pair set evaluation     | number |          |                       `3000`                        |

---

## Endpoint

**Name:** `coinpaprika-state` (alias: `state`)

### Input Parameters

|    Name    | Required | Aliases        | Description        | Type   |            Example            |
| :--------: | :------: | -------------- | ------------------ | ------ | :---------------------------: |
|   `base`   |    ✅    | `coin`, `from` | Base asset symbol  | string |   `LUSD`, `ALETH`, `CBETH`    |
|  `quote`   |    ✅    | `market`, `to` | Quote asset symbol | string |         `USD`, `ETH`          |
| `endpoint` |          |                | Endpoint selector  | string | `coinpaprika-state` / `state` |

### Example Requests

**Using the primary endpoint `coinpaprika-state`**

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"data":{"base":"LUSD","quote":"USD","endpoint":"coinpaprika-state"}}'
```

**Using the alias `state`**

```bash
curl -X POST http://localhost:8080 \
    -H "Content-Type: application/json" \
    -d '{"data": {"base": "LUSD", "quote": "USD", "endpoint": "state"}}'
```

**Without endpoint (uses default)**

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"data": {"base": "LUSD", "quote": "USD"}}'
```

### Example Response

```json
{
  "data": {
    "result": 1.000979,
    "timestamp": 1758888503
  },
  "statusCode": 200,
  "result": 1.000979,
  "timestamps": {
    "providerDataRequestedUnixMs": 1758888508939,
    "providerDataReceivedUnixMs": 1758888508939,
    "providerIndicatedTimeUnixMs": 1758888503000
  },
  "meta": {
    "adapterName": "COINPAPRIKA_STATE",
    "metrics": {
      "feedId": "{\"base\":\"lusd\",\"quote\":\"usd\"}"
    }
  }
}
```

---

## Streaming Data

### Streaming Method Selection: Multiple Assets via POST (Sessionless)

Per the “EA Requirements – Coinpaprika State” doc, Coinpaprika offers:

1. **Single Asset via GET** — simple but requires one connection per pair
2. **Multiple Assets via POST (Sessionless)** — ✅ **SELECTED APPROACH**
3. **Multiple Assets via Session** — requires session management overhead

### Streaming Data Response

> Numeric values may arrive as **strings**; the adapter coerces them to numbers and skips malformed JSON frames.

The adapter receives real-time data from Coinpaprika in the following format:

```text
data:{
   "block_time":1758892511,
   "send_timestamp":1758892514,
   "base_token_symbol":"ALETH",
   "quote_symbol":"USD",
   "volume_7d_usd":190502.190952,
   "market_depth_plus_1_usd":0.000000,
   "market_depth_minus_1_usd":0.000000,
   "state_price":3835.519084
}
event:t_s

data:{
   "block_time":1758892487,
   "send_timestamp":1758892514,
   "base_token_symbol":"EURA",
   "quote_symbol":"USD",
   "volume_7d_usd":36039.253665,
   "market_depth_plus_1_usd":0.000000,
   "market_depth_minus_1_usd":0.000000,
   "state_price":1.158675
}
event:t_s

data:{
   "block_time":1758892511,
   "send_timestamp":1758892515,
   "base_token_symbol":"LUSD",
   "quote_symbol":"USD",
   "volume_7d_usd":23434.612065,
   "market_depth_plus_1_usd":0.000000,
   "market_depth_minus_1_usd":0.000000,
   "state_price":1.000883
}
event:t_s
```

---

## Architecture

### Transport

`CoinpaprikaStateTransport` (extends framework `SubscriptionTransport`)

- **Single SSE connection** for all active pairs
- **Dynamic pair batching**; reconnects when the pair set changes
- **Malformed event tolerance** (skips bad JSON frames, keeps last good value)
- **Numeric coercion** for `state_price` & `block_time` (string → number)
- **Error mapping**: `401/400/429` passthrough, `500 → 502`, **no data → 504**
- **Graceful shutdown** + reconnect backoff with jitter

### Data Flow

1. **Background Handler** monitors requested pairs and manages SSE connection
2. **SSE Parser** handles chunked event streams (`src/transport/sse.ts`)
3. **Processing** (`src/transport/coinpaprika-state.ts`) normalizes symbols, coerces numbers, validates payloads, and writes to the response cache
4. **Serving requests** returns the latest cached tick for the requested pair

### Error Handling

| Provider Status | Adapter Status | Description                             |
| :-------------: | :------------: | :-------------------------------------- |
|      `401`      |     `401`      | Unauthorized                            |
|      `400`      |     `400`      | Bad Request                             |
|      `429`      |     `429`      | Rate Limited                            |
|      `500`      |     `502`      | Bad Gateway - Provider error            |
|   No data yet   |     `504`      | Foreground fallback when cache is empty |

---

## Development

### Build

```bash
yarn workspace @chainlink/coinpaprika-state-adapter build
```

### Start

```bash
 API_KEY="your-api-key-here" yarn start coinpaprika-state
```

### Test

```bash
# Integration
yarn test packages/sources/coinpaprika-state/test/integration/adapter.test.ts

# Unit
yarn test packages/sources/coinpaprika-state/test/unit/sse.test.ts
```

---

## Notes

- **First-tick latency**: Until the first valid tick is cached, foreground requests may return `504`.
- **Symbol normalization**: `base`/`quote` are uppercased; stick to canonical symbols.
- **Numeric coercion**: Provider may send numerics as strings; invalid numerics are dropped.
