# Chainlink Yahoo Finance External Adapter

This adapter is for Yahoo Finance and supports the quote endpoint.

## Input params

- `base`, `from` or `asset`: The asset to query

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "price": {
   "maxAge": 1,
   "regularMarketChangePercent": -0.0016103031,
   "regularMarketChange": -9.280273,
   "regularMarketTime": "2020-05-04T15:35:30.000Z",
   "priceHint": 2,
   "regularMarketPrice": 5753.78,
   "regularMarketDayHigh": 5792.85,
   "regularMarketDayLow": 5702.03,
   "regularMarketVolume": 0,
   "regularMarketPreviousClose": 5763.06,
   "regularMarketSource": "DELAYED",
   "regularMarketOpen": 5763.06,
   "exchange": "FGI",
   "exchangeName": "FTSE Index",
   "exchangeDataDelayedBy": 15,
   "marketState": "POST",
   "quoteType": "INDEX",
   "symbol": "^FTSE",
   "underlyingSymbol": null,
   "shortName": "FTSE 100",
   "longName": null,
   "currency": "GBP",
   "currencySymbol": "£",
   "fromCurrency": null,
   "toCurrency": null,
   "lastMarket": null
  },
  "result": 5753.78
 },
 "result": 5753.78,
 "statusCode": 200
}
```
