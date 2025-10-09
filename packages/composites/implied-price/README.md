# Computed Price Composite Adapter

The Computed Price adapter performs mathematical operations (divide or multiply) on results from multiple source adapters to calculate implied prices and other derived values.

## Features

- **Dual Operations**: Supports both division and multiplication operations
- **Multiple Sources**: Aggregates data from multiple price source adapters
- **High Reliability**: Built-in circuit breakers, retry logic, and timeout handling
- **Flexible Input**: Supports both `from`/`to` and `base`/`quote` parameter formats
- **High-Precision Math**: Uses `decimal.js` for accurate financial calculations
- **Comprehensive Testing**: 52 unit and integration tests covering all scenarios
- **Type Safety**: Full TypeScript support with proper interfaces

## Configuration

The adapter accepts the following environment variables for reliability and performance tuning:

| Required? |                Name                |            Description             | Options | Defaults to |
| :-------: | :--------------------------------: | :--------------------------------: | :-----: | :---------: |
|           |          `SOURCE_TIMEOUT`          |    Source adapter timeout (ms)     |         |   `10000`   |
|           |           `MAX_RETRIES`            |       Maximum retry attempts       |         |     `3`     |
|           |           `RETRY_DELAY`            |          Retry delay (ms)          |         |   `1000`    |
|           | `SOURCE_CIRCUIT_BREAKER_THRESHOLD` | Circuit breaker failure threshold  |         |     `5`     |
|           |  `SOURCE_CIRCUIT_BREAKER_TIMEOUT`  |    Circuit breaker timeout (ms)    |         |   `60000`   |
|           |    `REQUEST_COALESCING_ENABLED`    |     Enable request coalescing      |         |   `true`    |
|           |   `REQUEST_COALESCING_INTERVAL`    |      Coalescing interval (ms)      |         |    `100`    |
|           |           `API_TIMEOUT`            |     API response timeout (ms)      |         |   `30000`   |
|           |          `WARMUP_ENABLED`          |       Enable warmup requests       |         |   `false`   |
|           |      `BACKGROUND_EXECUTE_MS`       | Background execution interval (ms) |         |   `10000`   |

## Input Parameters

Every request requires the following parameters:

| Required? |         Name         |                 Description                  |    Type    |       Options        | Default | Depends On | Not Valid With |
| :-------: | :------------------: | :------------------------------------------: | :--------: | :------------------: | :-----: | :--------: | :------------: |
|    ✅     |  `dividendSources`   | Array of source adapters for dividend values | `string[]` |                      |         |            |                |
|           | `dividendMinAnswers` |     Minimum required dividend responses      |  `number`  |                      |   `1`   |            |                |
|    ✅     |   `dividendInput`    |   JSON string payload for dividend sources   |  `string`  |                      |         |            |                |
|    ✅     |   `divisorSources`   | Array of source adapters for divisor values  | `string[]` |                      |         |            |                |
|           | `divisorMinAnswers`  |      Minimum required divisor responses      |  `number`  |                      |   `1`   |            |                |
|    ✅     |    `divisorInput`    |   JSON string payload for divisor sources    |  `string`  |                      |         |            |                |
|    ✅     |     `operation`      |      Mathematical operation to perform       |  `string`  | `divide`, `multiply` |         |            |                |

### Input Formats

**Sources**: Array of adapter names

```javascript
;['coingecko', 'coinpaprika', 'coinbase']
```

**Input Objects**: JSON string containing the payload for source adapters

```javascript
JSON.stringify({
  base: 'ETH', // or "from": "ETH"
  quote: 'USD', // or "to": "USD"
  overrides: {
    coingecko: {
      ETH: 'ethereum',
    },
  },
})
```

**Operation**: The mathematical operation to perform

- `"divide"` - Returns `dividend / divisor` (implied price calculation)
- `"multiply"` - Returns `dividend * divisor` (price multiplication)

## Sample Input

### Division Example (Implied Price)

```json
{
  "data": {
    "dividendSources": ["coingecko", "coinpaprika"],
    "divisorSources": ["coingecko", "coinpaprika"],
    "dividendInput": "{\"base\":\"ETH\",\"quote\":\"USD\"}",
    "divisorInput": "{\"base\":\"BTC\",\"quote\":\"USD\"}",
    "operation": "divide"
  }
}
```

### Multiplication Example

```json
{
  "data": {
    "dividendSources": ["coingecko"],
    "divisorSources": ["coingecko"],
    "dividendInput": "{\"base\":\"ETH\",\"quote\":\"USD\"}",
    "divisorInput": "{\"base\":\"BTC\",\"quote\":\"USD\"}",
    "operation": "multiply"
  }
}
```

## Sample Output

```json
{
  "result": 0.0652,
  "statusCode": 200,
  "data": {
    "result": 0.0652
  }
}
```

## Calculation

The adapter:

1. Fetches price data from dividend sources using the `dividendInput` payload
2. Fetches price data from divisor sources using the `divisorInput` payload
3. Calculates the median of each set of responses
4. Performs the specified operation:
   - **Divide**: `dividend_median / divisor_median`
   - **Multiply**: `dividend_median * divisor_median`

## Reliability Features

- **Circuit Breaker**: Automatically disables failing sources after consecutive failures
- **Retry Logic**: Configurable retry attempts with exponential backoff
- **Request Coalescing**: Prevents duplicate requests to the same source
- **Request Timeouts**: Configurable timeouts for source responses

## Usage

The adapter is designed to calculate implied prices and perform mathematical operations on price data from multiple sources. Common use cases include:

- **Implied Price Calculation**: Calculate ETH/BTC implied price by dividing ETH/USD by BTC/USD
- **Portfolio Valuation**: Multiply token quantities by their USD prices
- **Cross-Rate Calculation**: Derive exchange rates between different currency pairs
- **Risk Metrics**: Calculate price ratios for volatility analysis

The adapter supports both `from`/`to` and `base`/`quote` parameter formats for maximum compatibility with different price sources.

## Testing

The adapter includes comprehensive test coverage with 52 tests (39 unit tests and 13 integration tests):

### Unit Tests

- **`calculateMedian`**: Tests median calculation with various scenarios (odd/even arrays, sorting, precision, edge cases)
- **`normalizeInput`**: Tests input format conversion, property preservation, error handling
- **`parseSources`**: Tests array/string parsing, comma-delimited strings, whitespace handling

### Integration Tests

- **Full Request Cycle**: Tests complete adapter functionality with mocked HTTP transport
- **Operation Support**: Tests both `divide` and `multiply` operations with various data combinations
- **Input Format Compatibility**: Tests both `base`/`quote` and `from`/`to` formats
- **Override Support**: Tests that override configurations work correctly with both operations
- **Error Handling**: Comprehensive error scenario testing with proper status codes (400, 422, 500, etc.)
- **Edge Cases**: Tests invalid operations, missing parameters, various crypto pairs, and malformed inputs

### Running Tests

```bash
# All tests
yarn test packages/composites/implied-price

# Unit tests only (39 tests)
yarn test packages/composites/implied-price/test/unit

# Integration tests only (13 tests)
yarn test packages/composites/implied-price/test/integration

# Specific test pattern
yarn test packages/composites/implied-price --testNamePattern="median"
```

## Development

### Building

```bash
# From adapter directory
yarn build

# From project root
yarn build
```

### Production Deployment

For production deployment, configure the following environment variables for each source adapter you plan to use:

```bash
COINGECKO_ADAPTER_URL=http://localhost:8080/coingecko
COINPAPRIKA_ADAPTER_URL=http://localhost:8080/coinpaprika
COINBASE_ADAPTER_URL=http://localhost:8080/coinbase
```

The adapter includes built-in reliability features such as circuit breakers, retry logic, and request coalescing that are automatically enabled in production environments.
