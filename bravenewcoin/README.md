# Chainlink External Adapter for BNC RapidAPI convert endpoint

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "success": true,
  "source": "BraveNewCoin",
  "request_date": "2020-04-13 19:23:15",
  "from_quantity": "1",
  "from_symbol": "ETH",
  "from_name": "Ethereum",
  "to_symbol": "USD",
  "to_name": "United States Dollar",
  "to_quantity": 154.5907109,
  "result": 154.5907109
 },
 "result": 154.5907109,
 "statusCode": 200
}
```
