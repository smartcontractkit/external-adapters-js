# Chainlink External Adapter for BraveNewCoin's 24 Hour USD VWAP

## Input Params

- `base`, `from`, `coin`, `symbol`, `assetId`, `indexId`, or `asset`: Retrieve all the OHLCV values for a particular asset or market 
- `indexType`: Restrict the OHLCV results to the index type. Either MWA or GWA
- `timestamp`: Retrieve all daily OHLCV records from the timestamp provided. All dates are stored in UTC. Timestamp strings should be in the form YYYY-MM-DDThh:mm:ssZ

## Environment Variables

- `API_KEY`: Your RapidAPI API key
- `CLIENT_ID`: Your RapidAPI client ID

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "content": [
   {
    "indexId": "551cdbbe-2a97-4af8-b6bc-3254210ed021",
    "indexType": "GWA",
    "open": 1.9248204798140678,
    "high": 2.5557035027423054,
    "low": 1.891225386234147,
    "close": 2.4208656452222885,
    "volume": 665942.7213355688,
    "vwap": 2.12777657752828,
    "twap": 2.07318626293901,
    "startTimestamp": "2020-07-08T00:00:00Z",
    "endTimestamp": "2020-07-08T23:59:59.999Z",
    "timestamp": "2020-07-08T00:00:00Z",
    "id": "637e68c3-681f-49c2-a69f-c239c14e1d18"
   }
  ],
  "nextId": "637e68c3-681f-49c2-a69f-c239c14e1d18",
  "result": 2.12777657752828
 },
 "result": 2.12777657752828,
 "statusCode": 200
}
```
