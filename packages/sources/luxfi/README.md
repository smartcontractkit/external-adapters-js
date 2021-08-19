# Chainlink External Adapter for Luxfi

### Input Parameters

| Required? |   Name   |     Description     |         Options          | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------: | :---------: |
|           | endpoint | The endpoint to use | [price](#Price-Endpoint) |    price    |

---

## Price Endpoint

Returns the median price of the selected item

### Input Params

| Required? |    Name    |                Description                 | Options | Defaults to |
| :-------: | :--------: | :----------------------------------------: | :-----: | :---------: |
|    ✅     |  `brand`   |  The brand of the item to query (int ID)   |         |             |
|    ✅     | `supplier` | The supplier of the item to query (int ID) |         |             |
|    ✅     |  `series`  |  The model of the item to query (int ID)   |         |             |
|    ✅     |  `color`   |       The color of the item to query       |         |             |
|    ✅     | `category` |  The category/style of the item to query   |         |             |
|    ✅     | `material` |     The material of the item to query      |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "brand": 6,
    "supplier": 227,
    "series": 1786,
    "color": "black",
    "category": "tote bag",
    "material": "patent leather"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "numberOfElements": 1,
    "totalElements": 1,
    "content": [
      {
        "id": 104659,
        "price": 1299.59,
        "o_price": 0,
        "brand": "Dior",
        "brand_id": 6,
        "series": "Lady Dior",
        "series_id": 1786,
        "color": "Black",
        "color_id": 1,
        "category": "Tote Bag",
        "type_id": 6,
        "material": "Patent Leather",
        "material_id": 53,
        "grade": "9.5",
        "grade_id": 3,
        "vendor": "PaiPai",
        "vendor_id": 227,
        "web_name": "paipai",
        "size": null,
        "spu": "B6S1786M53",
        "sku": "0/paipai10025710362992",
        "img_count": "1",
        "sold_count": "0",
        "title": "【二手95新】DIOR 迪奥黑银漆皮七格戴妃包奢侈品女士包",
        "detail_url": "https://paipai.m.jd.com/m/goods_detail_c.html?usedNo=10025710362992",
        "area_id": 41,
        "on_chain": 0,
        "created_at": "2021-05-21 07:15:34",
        "size2": {
          "cm": null,
          "inch": null
        },
        "soldDate": "2021-01-05"
      }
    ],
    "size": 200,
    "totalPages": 1,
    "number": 0,
    "result": 1299.59
  },
  "result": 1299.59,
  "statusCode": 200
}
```
