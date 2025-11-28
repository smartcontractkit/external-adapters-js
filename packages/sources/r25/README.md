# Chainlink R25 External Adapter

This adapter fetches the latest NAV (Net Asset Value) via R25's REST API and returns a single numeric result with timestamps for both Data Feeds and Data Streams.

## Configuration

The adapter takes the following environment variables:

| Required? |      Name      |                 Description                 |  Type  | Options |        Default        |
| :-------: | :------------: | :-----------------------------------------: | :----: | :-----: | :-------------------: |
|    ✅     |   `API_KEY`    |             An API key for R25              | string |         |                       |
|    ✅     |  `API_SECRET`  | An API secret for R25 used to sign requests | string |         |                       |
|           | `API_ENDPOINT` |           An API endpoint for R25           | string |         | `https://app.r25.xyz` |

## Input Parameters

### `nav` endpoint

Supported names for this endpoint are: `nav`, `price`.

#### Input Params

| Required? |    Name     |             Description             |  Type  | Options | Default |
| :-------: | :---------: | :---------------------------------: | :----: | :-----: | :-----: |
|    ✅     | `chainType` | The chain type (e.g., polygon, sui) | string |         |         |
|    ✅     | `tokenName` |    The token name (e.g., rcusdp)    | string |         |         |

### Example

Request:

```json
{
  "data": {
    "endpoint": "nav",
    "chainType": "polygon",
    "tokenName": "rcusdp"
  }
}
```

Response:

```json
{
  "data": {
    "result": 1.020408163265306
  },
  "result": 1.020408163265306,
  "timestamps": {
    "providerIndicatedTimeUnixMs": 1731344153448
  },
  "statusCode": 200
}
```

## Rate Limiting

The adapter implements rate limiting of 5 requests/second per IP as specified in the R25 API documentation.

## Authentication

The adapter automatically generates the following headers for authentication:

- `x-api-key`: API key
- `x-utc-timestamp`: Current timestamp in milliseconds
- `x-signature`: HMAC-SHA256 signature

### Signature Algorithm

The signature is generated using the HMAC-SHA256 algorithm. The signature string is constructed as follows:

```
{method}\n{path}\n{sorted_params}\n{timestamp}\n{api_key}
```

Where:

- `method`: HTTP method in lowercase (e.g., "get")
- `path`: Request path (e.g., "/api/public/current/nav")
- `sorted_params`: Query parameters sorted by key in lexicographical order, formatted as key=value, joined with &
- `timestamp`: Current UTC timestamp in milliseconds
- `api_key`: API key

The HMAC-SHA256 hash is computed using the `API_SECRET` as the secret key, and the result is hex-encoded.

## API Response Mapping

### Data Feeds mapping

- `answer` = `currentNav` (from API response)

### Data Streams mapping

- `navPerShare` = `currentNav`
- `aum` = `totalAsset`
- `navDate` = `lastUpdate`
