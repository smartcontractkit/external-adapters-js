# Chainlink External Adapter for AlphaVantage

Use this adapter for connecting to AlphaVantage's API from a Chainlink node.

## Input params

- `function`: (Optional) The function to call (defaults to CURRENCY_EXCHANGE_RATE)
- `base`, `from`, or `coin`: The asset to query
- `quote`, `to`, or `market`: The currency to convert to

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "Realtime Currency Exchange Rate": {
   "1. From_Currency Code": "ETH",
   "2. From_Currency Name": "Ethereum",
   "3. To_Currency Code": "USD",
   "4. To_Currency Name": "United States Dollar",
   "5. Exchange Rate": "170.88000000",
   "6. Last Refreshed": "2020-04-16 19:15:01",
   "7. Time Zone": "UTC",
   "8. Bid Price": "170.84000000",
   "9. Ask Price": "170.88000000"
  },
  "result": 170.88
 },
 "result": 170.88,
 "statusCode": 200
}
```
