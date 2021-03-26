# Chainlink External Adapter for 1forge

### Environment Variables

| Required? |  Name   |                        Description                        | Options | Defaults to |
| :-------: | :-----: | :-------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from the 1forge dashboard |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |    price    |

---

## Price Endpoint

[`/convert`](https://1forge.com/api#convert) - Convert from one currency to another

### Input Params

| Required? |      Name      |                  Description                  |                 Options                  | Defaults to |
| :-------: | :------------: | :-------------------------------------------: | :--------------------------------------: | :---------: |
|    ✅     | `base`, `from` |      The symbol of the currency to query      | [List](https://1forge.com/currency-list) |             |
|    ✅     | `quote`, `to`  |   The symbol of the currency to convert to    | [List](https://1forge.com/currency-list) |             |
|    🟡     |   `quantity`   | An additional amount of the original currency |                                          |             |
|    🟡     |   `overrides`   | If base provided is found in overrides, that will be used  | [Format](../presetSymbols.json)|             |


### Output

```json
{
  "jobRunID": "1",
  "data": {
    "value": 1.22687,
    "text": "1.0 GBP is worth 1.22687 USD",
    "timestamp": 1587489920,
    "result": 1.22687
  },
  "result": 1.22687,
  "statusCode": 200
}
```
