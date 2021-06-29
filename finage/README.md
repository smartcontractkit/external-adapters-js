# Chainlink External Adapter for Finage

## Input Params

- `base`, `from`, or `symbol`: The symbol of the asset to query
- `overrides`: (not required) If base provided is found in overrides, that will be used. [Format](../external-adapter/src/overrides/presetSymbols.json)

## Output

```json
{
   "jobRunID":"1",
   "data":{
      "currencies":[
         {
            "name":"UK100",
            "value":6395.5,
            "change":61,
            "difference":0.96
         }
      ],
      "lastUpdate":"2020-11-27T17:07:02",
      "lastUpdate_Timestamp":"1606496822",
      "result":6395.5
   },
   "result":6395.5,
   "statusCode":200
}
```
