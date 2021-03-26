# Chainlink External Adapter for Tradermade

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `to`: The symbol of the currency to convert to (for FX)
- `overrides`: (not required) If base provided is found in overrides, that will be used. [Format](../presetSymbols.json)

## Output

```json
{
   "jobRunID":"1",
   "data":{
      "endpoint":"live",
      "quotes":[
         {
            "ask":1.19009,
            "base_currency":"EUR",
            "bid":1.19008,
            "mid":1.19009,
            "quote_currency":"USD"
         }
      ],
      "requested_time":"Wed, 25 Nov 2020 10:03:19 GMT",
      "timestamp":1606298600,
      "result":1.19009
   },
   "result":1.19009,
   "statusCode":200
}
```
