# Chainlink External Adapter for Coinmonitor

## Input Params

- `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to

## Output

```json
{
   "jobRunID":"1",
   "data":{
      "mediana_venta":"2623529.25",
      "mediana_compra":"2509498.948978",
      "mediana_prom":"2566514.074489",
      "dol_BTC_venta":"156.07",
      "dol_BTC_compra":"149.22",
      "dol_BTC_prom":"152.64",
      "best_buy_ars":"2553342.80",
      "best_sell_ars":"2587109.58",
      "time":1606498024,
      "updated":"27-11-20 | 14:27:04",
      "result":2566514.074489
   },
   "result":2566514.074489,
   "statusCode":200
}
```
