# Chainlink External Adapter for BNC RapidAPI convert endpoint

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to

## Environment Variables

- `API_KEY`: Your RapidAPI API key
- `CLIENT_ID`: Your RapidAPI client ID

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 8.533507688737274
  },
  "result": 8.533507688737274
  "statusCode": 200
}
```
