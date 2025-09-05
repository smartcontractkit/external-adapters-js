# Chainlink Ondo GM Tokenized Composite Adapter

A composite adapter that calculates tokenized prices for Ondo GM tokens (e.g., TSLAon, SPYon, QQQon) by combining:

1. **Underlying asset prices** from Chainlink Equities Price Feeds (Data Streams)
2. **Multiplier data** from Ondo Finance API

The adapter returns `tokenizedPrice = underlyingPrice × activeMultiplier` with 8 decimal precision.

## How It Works

Ondo GM tokens are total-return trackers that track underlying equities with adjustable multipliers. This adapter:

1. Fetches the latest underlying price from Chainlink Data Streams using the provided `feedId`
2. Retrieves multiplier information from Ondo's API
3. Calculates the active multiplier based on activation logic (supports pending multiplier changes)
4. Returns the tokenized price with 8 decimal precision

## Configuration

The adapter requires the following environment variables:

| Required? |        Name        |                    Description                     | Options | Defaults to |
| :-------: | :----------------: | :------------------------------------------------: | :-----: | :---------: |
|    ✅     |   `ONDO_API_KEY`   |          API key for Ondo Finance API             |         |             |
|           | `STREAMS_API_KEY`  |      API key for Chainlink Data Streams           |         |             |
|           | `STREAMS_API_SECRET` |    API secret for Chainlink Data Streams        |         |             |
|           |   `ONDO_BASE_URL`  |           Base URL for Ondo Finance API           |         | `https://api.gm.ondo.finance` |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Parameters

| Required? |     Name     |                              Description                               |           Options            | Defaults to |
| :-------: | :----------: | :--------------------------------------------------------------------: | :--------------------------: | :---------: |
|    ✅     |   `symbol`   |                   GM token symbol to get price for                    | `TSLAon`, `SPYon`, `QQQon`   |             |
|           | `underlying` | Base ticker (if not provided, derived from symbol)                    | `TSLA`, `SPY`, `QQQ`         |             |
|           |   `feedId`   | Data Streams feed ID (if not provided, derived from symbol/underlying)| `equities:TSLA:mid`, etc.    |             |

### Supported Symbols

The adapter includes built-in support for:

- **TSLAon** → underlying: TSLA, feedId: equities:TSLA:mid
- **SPYon** → underlying: SPY, feedId: equities:SPY:mid  
- **QQQon** → underlying: QQQ, feedId: equities:QQQ:mid

Additional symbols can be supported by providing `underlying` and `feedId` parameters in the request.

### Sample Input

```json
{
  "id": "1",
  "data": {
    "symbol": "TSLAon"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "tokenizedPrice": "239.12345678",
    "underlyingPrice": 250.75,
    "activeMultiplier": 0.95321,
    "symbol": "TSLAon",
    "feedId": "equities:TSLA:mid"
  },
  "result": "239.12345678",
  "statusCode": 200
}
```

## Multiplier Activation Logic

The adapter supports automatic multiplier transitions:

1. **Current state**: Uses `sharesMultiplier` from Ondo API
2. **Pending changes**: If `newMultiplier` and `activationDateTime` are present:
   - Before activation: uses current multiplier
   - After activation: uses new multiplier
3. **Calculation**: `activeMultiplier = (nowUTC >= activationDateTime) ? newMultiplier : currentMultiplier`

## Data Sources

- **Underlying Prices**: Chainlink Equities Price Feeds via Data Streams
- **Multipliers**: Ondo Finance API endpoint `GET /v1/assets/{symbol}/market`

## API Endpoints

### Ondo Finance API
- **URL**: `https://api.gm.ondo.finance/v1/assets/{symbol}/market`
- **Authentication**: Bearer token via `ONDO_API_KEY`
- **Response**: Contains `primaryMarket.sharesMultiplier` and optional `newMultiplier`/`activationDateTime`

### Chainlink Data Streams
- **Authentication**: API key/secret via `STREAMS_API_KEY`/`STREAMS_API_SECRET`
- **Data**: Latest equity prices by `feedId`

## Error Handling

The adapter includes comprehensive error handling for:
- Invalid or unknown symbols
- Missing environment variables
- API communication failures
- Data validation errors
- Network timeouts and retries

## Extensibility

To add new GM tokens:
1. Add symbol mapping to `ASSET_CONFIG` in the code, or
2. Provide `underlying` and `feedId` parameters in requests

Example for custom symbol:
```json
{
  "data": {
    "symbol": "AAPLon",
    "underlying": "AAPL", 
    "feedId": "equities:AAPL:mid"
  }
}
```
