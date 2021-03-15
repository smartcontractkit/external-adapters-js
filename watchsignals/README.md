# Chainlink External Adapter for WatchSignals

### Environment Variables

| Required? |  Name   |                                     Description                                     | Options | Defaults to |
| :-------: | :-----: | :---------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | API_KEY | An API key that can be obtained from [here](https://api.watchsignals.com/#api-keys) |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |               Options                | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [avg-price](#Average-Price-Endpoint) |  avg-price  |

---

## Average Price Endpoint

Returns the average price for a specific watch model

### Input Params

| Required? |    Name     |                    Description                     | Options | Defaults to |
| :-------: | :---------: | :------------------------------------------------: | :-----: | :---------: |
|    ✅     | `refNumber` | The reference number of the watch to get price for |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "refNumber": "RM1101"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "status": "success",
    "data": [
      {
        "staticid": "48791",
        "watchname": "Richard Mille RM 11-01",
        "watchimage": "https://assets.phillips.com/image/upload/t_Website_LotDetailMainImage/v1556223300/auctions/HK080119/928_001.jpg",
        "referencenumber": "RM1101",
        "watchmodel": "undefined",
        "brandid": "377",
        "casematerialid": "44",
        "braceletmaterialid": "25",
        "bucklematerialid": "25",
        "inner_image": "48791_Richard_Mille_RM_11-01_.jpg",
        "brandname": "Richard Mille",
        "casematerialname": "Titanium",
        "braceletmaterialname": "Rubber",
        "bucketmaterialname": "Rubber",
        "minprice": "221880",
        "maxprice": "221880",
        "offers": "1",
        "currency": "USD",
        "count_models": "26505",
        "min_minprice": "627.7153123987949",
        "max_maxprice": "3000000",
        "count_dynamic": "88192",
        "avg_price": "221880"
      }
    ],
    "result": "221880"
  },
  "result": "221880",
  "statusCode": 200
}
```
