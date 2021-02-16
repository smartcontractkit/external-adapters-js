# Chainlink External Adapter for Tiingo

## Configuration

This adapter supports the following environment variables:

- `API_KEY`: Your Tiingo API key

## Input Params

- `ticker`: The stock ticker to query
- `field`: Value to be returned. Default is `close`. Available values: `date`,`close`,`high`,`low`,`open`,`volume`,`adjClose`,`adjHigh`,`adjLow`,`adjOpen`,`adjVolume`,`divCash`,`splitFactor`.

### EOD endpoint

Gets the most recent End of Day price for a stock. [supported tickers](https://apimedia.tiingo.com/docs/tiingo/daily/supported_tickers.zip) (zip format) at Tiingo. Additional endpoint docs are also [available](https://api.tiingo.com/documentation/end-of-day).

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 342.86
  },
  "result": 342.86,
  "statusCode": 200
}
```
