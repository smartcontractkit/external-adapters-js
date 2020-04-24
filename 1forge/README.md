# Chainlink 1Forge External Adapter

## Input Params

- `base` or `to`: The target currency to query (required)
- `quote` or `from`: The currency to convert to (required)
- `endpoint`: The endpoint to call (optional)

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "value": 1.22687,
  "text": "1.0 GBP is worth 1.22687 USD",
  "timestamp": 1587489920,
  "result": 1.22687
 },
 "result": 1.22687,
 "statusCode": 200
}
```
