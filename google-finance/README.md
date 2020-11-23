# Chainlink Google Finance External Adapter

This adapter is for Google Finance and supports the quote endpoint.

## Input params

- `base`, `from` or `asset`: The asset to query

## Output

```json
{
 "jobRunID": "1",
 "data": {
  "symbol": "NASDAQ:AAPL",
  "companyName": "297.92 USD",
  "ticker": 297.92,
  "last": 297.92,
  "open": 295.06,
  "high": 298.07,
  "low": 294.46,
  "marketCap": "1.29T",
  "peRatio": 23.36,
  "yield": 1.1,
  "prevClose": 293.16,
  "high52week": 327.85,
  "low52week": 170.27,
  "result": 297.92
 },
 "result": 297.92,
 "statusCode": 200
}
```

## Build instructions

When building this adapter for AWS Lambda, there are a few extra steps:

After running `make zip adapter=google-finance`, 3 extra files will be created in the `google-finance/dist/` directory:

- aws.tar.br
- chromium.br
- swiftshader.tar.br

**These files needs to be moved inside the `google-finance-adapter.zip` file that was generated.** You can then upload 
the updated zip and proceed with the usual steps.
