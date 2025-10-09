# Computed Price Composite Adapter

The Computed Price adapter performs mathematical operations (divide or multiply) on results from multiple source adapters to calculate implied prices and other derived values.

## Features

- **Dual Operations**: Supports both division and multiplication operations
- **Multiple Sources**: Aggregates data from multiple price source adapters
- **High Reliability**: Built-in circuit breakers, retry logic, and timeout handling
- **Flexible Input**: Supports both `from`/`to` and `base`/`quote` parameter formats
- **High-Precision Math**: Uses `decimal.js` for accurate financial calculations
- **Comprehensive Testing**: 51 unit and integration tests covering all scenarios
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

This adapter supports **both v2 endpoint parameter formats** for full backward compatibility:

### Format 1: operand1/operand2 (v2 computedPrice endpoint)

| Required? |         Name         |                 Description                  |    Type    |       Options        | Default | Depends On | Not Valid With |
| :-------: | :------------------: | :------------------------------------------: | :--------: | :------------------: | :-----: | :--------: | :------------: |
|    ✅     |  `operand1Sources`   | Array of source adapters for operand1 values | `string[]` |                      |         |            |                |
|           | `operand1MinAnswers` |     Minimum required operand1 responses      |  `number`  |                      |   `1`   |            |                |
|    ✅     |   `operand1Input`    |   JSON string payload for operand1 sources   |  `string`  |                      |         |            |                |
|    ✅     |  `operand2Sources`   | Array of source adapters for operand2 values | `string[]` |                      |         |            |                |
|           | `operand2MinAnswers` |     Minimum required operand2 responses      |  `number`  |                      |   `1`   |            |                |
|    ✅     |   `operand2Input`    |   JSON string payload for operand2 sources   |  `string`  |                      |         |            |                |
|    ✅     |     `operation`      |      Mathematical operation to perform       |  `string`  | `divide`, `multiply` |         |            |                |

### Format 2: dividend/divisor (v2 impliedPrice endpoint)

| Required? |         Name         |                 Description                  |    Type    |       Options        | Default  | Depends On | Not Valid With |
| :-------: | :------------------: | :------------------------------------------: | :--------: | :------------------: | :------: | :--------: | :------------: |
|    ✅     |  `dividendSources`   | Array of source adapters for dividend values | `string[]` |                      |          |            |                |
|           | `dividendMinAnswers` |     Minimum required dividend responses      |  `number`  |                      |   `1`    |            |                |
|    ✅     |   `dividendInput`    |   JSON string payload for dividend sources   |  `string`  |                      |          |            |                |
|    ✅     |   `divisorSources`   | Array of source adapters for divisor values  | `string[]` |                      |          |            |                |
|           | `divisorMinAnswers`  |      Minimum required divisor responses      |  `number`  |                      |   `1`    |            |                |
|    ✅     |    `divisorInput`    |   JSON string payload for divisor sources    |  `string`  |                      |          |            |                |
|           |     `operation`      |      Mathematical operation to perform       |  `string`  | `divide`, `multiply` | `divide` |            |                |

> **Note**: Use either Format 1 (operand1/operand2) OR Format 2 (dividend/divisor) - do not mix parameter names from different formats.

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

### Format 1: operand1/operand2 (v2 computedPrice endpoint)

**Division Example:**

```json
{
  "data": {
    "operand1Sources": ["coingecko", "coinpaprika"],
    "operand2Sources": ["coingecko", "coinpaprika"],
    "operand1Input": "{\"base\":\"ETH\",\"quote\":\"USD\"}",
    "operand2Input": "{\"base\":\"BTC\",\"quote\":\"USD\"}",
    "operation": "divide"
  }
}
```

**Multiplication Example:**

```json
{
  "data": {
    "operand1Sources": ["coingecko"],
    "operand2Sources": ["coingecko"],
    "operand1Input": "{\"from\":\"LINK\",\"to\":\"USD\",\"overrides\":{\"coingecko\":{\"LINK\":\"chainlink\"}}}",
    "operand2Input": "{\"from\":\"ETH\",\"to\":\"USD\",\"overrides\":{\"coingecko\":{\"ETH\":\"ethereum\"}}}",
    "operation": "multiply"
  }
}
```

### Format 2: dividend/divisor (v2 impliedPrice endpoint)

**Division Example (Implied Price):**

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

**Multiplication Example:**

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

**Division with Default Operation (operation omitted):**

```json
{
  "data": {
    "dividendSources": ["coingecko"],
    "divisorSources": ["coingecko"],
    "dividendInput": "{\"from\":\"LINK\",\"to\":\"USD\"}",
    "divisorInput": "{\"from\":\"ETH\",\"to\":\"USD\"}"
  }
}
```

**Default Endpoint (no endpoint specified - v2 behavior):**

```json
{
  "data": {
    "dividendSources": ["coingecko"],
    "divisorSources": ["coingecko"],
    "dividendInput": "{\"from\":\"LINK\",\"to\":\"USD\"}",
    "divisorInput": "{\"from\":\"ETH\",\"to\":\"USD\"}"
  }
}
```

> When using Format 2 (dividend/divisor), the `operation` parameter is optional and defaults to `"divide"`. When no endpoint is specified, it defaults to `impliedPrice` for full v2 backward compatibility.

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

The adapter performs the following steps regardless of parameter format:

1. **Data Fetching**: Fetches price data from the first set of sources using the first input payload

   - Format 1: `operand1Sources` with `operand1Input`
   - Format 2: `dividendSources` with `dividendInput`

2. **Data Fetching**: Fetches price data from the second set of sources using the second input payload

   - Format 1: `operand2Sources` with `operand2Input`
   - Format 2: `divisorSources` with `divisorInput`

3. **Median Calculation**: Calculates the median of each set of responses

4. **Mathematical Operation**: Performs the specified operation:
   - **Divide**: `first_median / second_median` (or `dividend_median / divisor_median`)
   - **Multiply**: `first_median * second_median` (or `dividend_median * divisor_median`)

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

The adapter includes comprehensive test coverage with 51 tests (37 unit tests and 14 integration tests):

### Unit Tests

- **`calculateMedian`**: Tests median calculation with various scenarios (odd/even arrays, sorting, precision, edge cases)
- **`normalizeInput`**: Tests input format conversion, property preservation, error handling
- **`parseSources`**: Tests array/string parsing, comma-delimited strings, whitespace handling

### Integration Tests

- **Backward Compatibility**: Full tests for both v2 parameter formats (`operand1`/`operand2` and `dividend`/`divisor`)
- **Full Request Cycle**: Tests complete adapter functionality with mocked HTTP transport
- **Operation Support**: Tests both `divide` and `multiply` operations with various data combinations
- **Input Format Compatibility**: Tests both `base`/`quote` and `from`/`to` formats
- **Override Support**: Tests that override configurations work correctly with both operations
- **Error Handling**: Comprehensive error scenario testing with proper status codes (400, 422, 500, etc.)
- **Edge Cases**: Tests invalid operations, missing parameters, various crypto pairs, and malformed inputs

### Running Tests

```bash
# All tests (51 total)
yarn test packages/composites/implied-price

# Unit tests only (37 tests)
yarn test packages/composites/implied-price/test/unit

# Integration tests only (14 tests)
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
