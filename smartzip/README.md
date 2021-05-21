# Chainlink External Adapter for SmartZip

Use SmartZip's Property Details API endpoint to retrieve the value of a home.

### Environment Variables

| Required? |  Name   |                            Description                             | Options | Defaults to |
| :-------: | :-----: | :----------------------------------------------------------------: | :-----: | :---------: |
|     ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard |         |             |

---

### Input Parameters

| Required? |   Name   |      Description      |      Options       | Defaults to |
| :-------: | :------: | :-------------------: | :----------------: | :---------: |
|           | endpoint | Endpoint to direct to | 'property-details' |     n/a     |

---

## Property Details Endpoint

Returns the AVM price

### Input Params

| Required? |     Name      |                 Description                 | Options | Defaults to |
| :-------: | :-----------: | :-----------------------------------------: | :-----: | :---------: |
|     ✅     | `property_id` | The ID of the property assigned by SmartZip |         |     n/a     |


### Sample Input

NOTE: that the property id in this example will fail if used in a real request.

```json
{
  "id": "1",
  "data": {
    "endpoint": "property-details",
    "property_id": "100000000000"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "price": 1197100,
    "result": 1197100
  },
  "statusCode": 200
}
```