# Chainlink External Adapter for IEX Cloud

## Input Params

- `base`, `from`, `coin`, `asset` or `symbol`: The symbol to query
- `quote`, `to`, or `market`: The symbol to convert to (required when endpoint is "crypto")
- `endpoint`: The endpoint to query, one of "stock" or "crypto". Default: stock.
- `overrides`: (not required) If base provided is found in overrides, that will be used. [Format](../external-adapter/src/overrides/presetSymbols.json)

## Output

```json
{
  "jobRunID":"1",
  "data":{
    "symbol":"TSLA",
    "companyName":"Tesla Inc",
    "primaryExchange":"NASDAQ/NGS (GLOBAL SELECT MARKET)",
    "calculationPrice":"close",
    "open":850.99,
    "openTime":1610721002325,
    "openSource":"official",
    "close":826.16,
    "closeTime":1610744400547,
    "closeSource":"official",
    "high":null,
    "highTime":null,
    "highSource":null,
    "low":null,
    "lowTime":null,
    "lowSource":null,
    "latestPrice":826.16,
    "latestSource":"Close",
    "latestTime":"January 15, 2021",
    "latestUpdate":1610744400547,
    "latestVolume":36985929,
    "iexRealtimePrice":null,
    "iexRealtimeSize":null,
    "iexLastUpdated":null,
    "delayedPrice":826.28,
    "delayedPriceTime":1610744379753,
    "oddLotDelayedPrice":826.41,
    "oddLotDelayedPriceTime":1610744379844,
    "extendedPrice":null,
    "extendedChange":null,
    "extendedChangePercent":null,
    "extendedPriceTime":null,
    "previousClose":845,
    "previousVolume":31266327,
    "change":-18.84,
    "changePercent":-0.0223,
    "volume":0,
    "iexMarketPercent":null,
    "iexVolume":null,
    "avgTotalVolume":43052769,
    "iexBidPrice":null,
    "iexBidSize":null,
    "iexAskPrice":null,
    "iexAskSize":null,
    "iexOpen":825,
    "iexOpenTime":1610745478811,
    "iexClose":826.03,
    "iexCloseTime":1610744397530,
    "marketCap":783117669575,
    "peRatio":1574.84,
    "week52High":880.02,
    "week52Low":72.24,
    "ytdChange":0.14844553261439497,
    "lastTradeTime":1610744397530,
    "isUSMarketOpen":false,
    "result":826.16
  },
  "result":826.16,
  "statusCode":200
}
```
