# Chainlink External Adapter for Nikkei

## Input Params

- `base`, `from`, or `asset`: The symbol of the currency to query
- `endpoint`: Optional endpoint param

## Output

```json
{
  "jobRunID": "1",
  "data": {
    "price": "22,437.27",
    "diff": "<!--daily_changing-->-41.52 (-0.18%)&nbsp;&nbsp;<span class=\"icon-arrow-dark-circle-right-down zoom-icon\" aria-hidden=\"true\"></span>",
    "diff_xs": "<!--daily_changing-->-41.52 (-0.18%)&nbsp;<span class=\"icon-arrow-dark-circle-right-down zoom-icon\" aria-hidden=\"true\"></span>",
    "price_diff": "<!--daily_changing--><div class=\"current_sub_pos\"><span class=\"current_sub_price\">22,437.27&nbsp;</span>-41.52 (-0.18%)&nbsp;&nbsp;<span class=\"icon-arrow-dark-circle-right-down zoom-icon\" aria-hidden=\"true\"></span>",
    "datedtime": "Jun/22/2020(*Close)",
    "datedtime_nkave": "Jun/22/2020 *Close",
    "open_price": "22,353.69",
    "opentime": "(09:00)",
    "high_price": "22,575.74",
    "hightime": "(12:33)",
    "low_price": "22,311.94",
    "lowtime": "(09:02)",
    "divisor": "27.760",
    "divisor_date": "(Jun/23/2020)",
    "result": 22437.27
  },
  "result": 22437.27,
  "statusCode": 200
}
```
