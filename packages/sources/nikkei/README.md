# Chainlink External Adapter for Nikkei

Version: 1.1.27

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

| Required? |     Name     | Description |  Type  | Options |                 Default                  |
| :-------: | :----------: | :---------: | :----: | :-----: | :--------------------------------------: |
|           | API_ENDPOINT |             | string |         | `https://indexes.nikkei.co.jp/en/nkave/` |

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                      Options                       | Default |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#stock-endpoint), [stock](#stock-endpoint) | `stock` |

---

## Stock Endpoint

**NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `stock` endpoint instead.**

Supported names for this endpoint are: `price`, `stock`.

### Input Params

| Required? | Name |    Aliases     |                                     Description                                      | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :------------: | :----------------------------------------------------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | base | `coin`, `from` | The symbol of the index to query [list](https://indexes.nikkei.co.jp/en/nkave/index) |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "stock",
    "base": "N225"
  }
}
```

Response:

```json
{
  "jobRunID": "1",
  "data": {
    "price": "28,860.62",
    "diff": "<!--daily_changing-->+405.02 (+1.42%)&nbsp;&nbsp;<span class=\"icon-arrow-dark-circle-right-up zoom-icon\" aria-hidden=\"true\"></span>",
    "diff_xs": "<!--daily_changing-->+405.02 (+1.42%)&nbsp;<span class=\"icon-arrow-dark-circle-right-up zoom-icon\" aria-hidden=\"true\"></span>",
    "price_diff": "<!--daily_changing--><div class=\"current_sub_pos\"><span class=\"current_sub_price\">28,860.62&nbsp;</span>+405.02 (+1.42%)&nbsp;&nbsp;<span class=\"icon-arrow-dark-circle-right-up zoom-icon\" aria-hidden=\"true\"></span>",
    "datedtime": "Dec/08/2021(*Close)",
    "datedtime_nkave": "Dec/08/2021 *Close",
    "open_price": "28,792.89",
    "opentime": "(09:00)",
    "high_price": "28,897.44",
    "hightime": "(13:39)",
    "low_price": "28,621.47",
    "lowtime": "(09:22)",
    "divisor": "28.373",
    "divisor_date": "(Dec/09/2021)",
    "result": 28860.62
  },
  "result": 28860.62,
  "statusCode": 200,
  "providerStatusCode": 200
}
```

---
