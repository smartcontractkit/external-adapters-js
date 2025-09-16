# BLOCKSIZE_CAPITAL_STATE

## Environment Variables

| Required? |      Name       |             Description              |  Type  | Options |                     Default                     |
| :-------: | :-------------: | :----------------------------------: | :----: | :-----: | :---------------------------------------------: |
|    ✅     |     API_KEY     | The Blocksize Capital API key to use | string |         |                                                 |
|           | WS_API_ENDPOINT |  The default WebSocket API base url  | string |         | `wss://data.blocksize.capital/marketdata/v1/ws` |

---

## Technical Notes

### WebSocket Endpoint

- **Default**: `wss://data.blocksize.capital/marketdata/v1/ws` (production)
- **Note**: The dev endpoint (`wss://blocksize.dev/marketdata/v1/ws`) currently fails authentication

### Logger Configuration

Custom logger included; can be replaced with `makeLogger` from `@chainlink/external-adapter-framework/util`

### Timestamp Recording

The adapter preserves the provider's timestamp (`block_time`) as `providerIndicatedTimeUnixMs` alongside Chainlink's processing timestamps for data traceability.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [state](#state-endpoint) | `state` |

## State Endpoint

Supported names for this endpoint are: `state`.

### Input Params

| Required? | Name  |    Aliases     |               Description                |  Type  |          Options          | Default | Depends On | Not Valid With |
| :-------: | :---: | :------------: | :--------------------------------------: | :----: | :-----------------------: | :-----: | :--------: | :------------: |
|    ✅     | base  | `coin`, `from` | The symbol of the currency to query for  | string | `CBBTC`, `ALETH`, `CBETH` |         |            |                |
|    ✅     | quote | `market`, `to` | The symbol of the currency to convert to | string |       `USD`, `ETH`        |         |            |                |

### Example

Request:

```bash
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d '{"data": {"base": "ALETH", "quote": "USD", "endpoint": "state"}}'
```

Adapter Response:

```json
{
  "data": {
    "result": 4412.262828
  },
  "result": 4412.262828,
  "timestamps": {
    "providerDataStreamEstablishedUnixMs": 1758026628749,
    "providerDataReceivedUnixMs": 1758026630734,
    "providerIndicatedTimeUnixMs": 1758026630000
  },
  "statusCode": 200,
  "meta": {
    "adapterName": "BLOCKSIZE_CAPITAL_STATE",
    "metrics": {
      "feedId": "{\"base\":\"aleth\",\"quote\":\"usd\"}"
    }
  }
}
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
        "block_time": 1758026650,
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

```json
{
  "jsonrpc": "2.0",
  "method": "state",
  "params": {
    "states": [
      {
        "block_time": 1758026654,
        "base_symbol": "ALETH",
        "quote_symbol": "USD",
        "aggregated_state_price": "4412.262828",
        "aggregated_plus_1_percent_usd_market_depth": "0",
        "aggregated_minus_1_percent_usd_market_depth": "0",
        "aggregated_7d_usd_trading_volume": "2038012.966"
      },
      {
        "block_time": 1758026654,
        "base_symbol": "CBBTC",
        "quote_symbol": "USD",
        "aggregated_state_price": "115358.0514",
        "aggregated_plus_1_percent_usd_market_depth": "8.639705238e+11",
        "aggregated_minus_1_percent_usd_market_depth": "344435369.8",
        "aggregated_7d_usd_trading_volume": "2559739583"
      }
    ]
  }
}
```

## Development & Testing

### Building the Adapter

```bash
yarn workspace @chainlink/blocksize-capital-state-adapter build
```

### Starting the Adapter

```bash
API_KEY="your-api-key-here" yarn start blocksize-capital-state
```

The adapter will start on port `8080` by default.

### Manual Testing Script

A test script (`/test/test-ws.sh`) is included for development and debugging purposes. This script demonstrates basic adapter functionality with sample requests.

**Prerequisites:**

- Adapter must be built and running (see above)
- Required environment variables must be set (`API_KEY`)

**Usage:**

```bash
chmod +x test/test-ws.sh
cd test && ./test-ws.sh
```

**Notes:**

- This script is intended for local development and debugging only
- If your adapter runs on a different port, update the URL in `test-ws.sh` accordingly (default: `http://localhost:8080`)
