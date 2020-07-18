# Chainlink External Adapter for [BraveNewCoin's AssetTicker endpoint](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_836afc67-19d2-45ae-bb56-c576cec9f602)

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to

## Environment Variables

- `API_KEY`: Your RapidAPI API key
- `CLIENT_ID`: Your RapidAPI client ID

Credentials can be obtained from [this](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_d040b5cb-b6da-4628-bb86-fef663f635dc) page (requires being logged in).

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 8.533507688737274
  },
  "result": 8.533507688737274,
  "statusCode": 200
}
```
