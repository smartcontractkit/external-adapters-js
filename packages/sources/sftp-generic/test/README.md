# SFTP Generic Adapter Tests

This directory contains comprehensive tests for the SFTP Generic External Adapter.

## Test Structure

### Integration Tests (`integration/`)
- **`adapter.test.ts`**: End-to-end tests for the entire adapter functionality
- **`fixtures.ts`**: Mock data and test fixtures
- **`__snapshots__/`**: Jest snapshots for consistent response validation

### Unit Tests (`unit/`)
- **`adapter.test.ts`**: Tests for the main adapter configuration
- **`config.test.ts`**: Tests for configuration settings and validation
- **`endpoint.test.ts`**: Tests for endpoint parameter validation and mapping
- **`transport.test.ts`**: Tests for SFTP transport logic and file operations

### Mocks (`mocks/`)
- **`sftpClient.ts`**: Mock implementation of ssh2-sftp-client for testing
- **`sftpServer.ts`**: Mock SFTP server for integration testing

## Test Coverage

The tests cover:

1. **Parameter Validation**
   - Required parameter validation
   - Invalid operation handling
   - Unsupported instrument handling

2. **SFTP Operations**
   - File download functionality
   - Connection management
   - Error handling (connection failures, timeouts, file not found)

3. **File Path Generation**
   - Date-based filename template substitution
   - Path normalization
   - Different remote path handling

4. **Environment Configuration**
   - Required environment variable validation
   - Default value testing

5. **Error Scenarios**
   - Connection failures
   - File operation failures
   - Missing files
   - Configuration errors

## Running Tests

```bash
# Run all tests
npm test

# Run integration tests only
npm test -- --testPathPattern=integration

# Run unit tests only
npm test -- --testPathPattern=unit

# Run with coverage
npm test -- --coverage
```

## Mock Data

The tests use mock CSV files representing different financial indices:
- FTSE100INDEX
- Russell1000INDEX
- Russell2000INDEX
- Russell3000INDEX

Each mock file contains sample financial data with appropriate headers and values for testing.
