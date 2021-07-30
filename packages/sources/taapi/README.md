# Chainlink External Adapter for taapi.io

## Input Params

- `indicator`: The TA indicator to query
- `base`, `from`, or `coin`: The base currency in the market to query
- `quote`, `to`, or `market`: The quote currency in the market to query
- `exchange`: The exchange to get data from
- `interval`: The time interval to use

## Output

```json
{
   "jobRunID":"1",
   "data":{
      "value":56.47492676496771,
      "result":56.47492676496771
   },
   "result":56.47492676496771,
   "statusCode":200
}
```
