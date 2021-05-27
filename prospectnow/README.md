# Chainlink External Adapter for ProspectNow

> ProspectNow covers every parcel on record in the US plus 30,000,000 
> businesses in all 50 states.
>     - ProspectNow


### Environment Variables

| Required? |  Name   |                            Description                             | Options | Defaults to |
| :-------: | :-----: | :----------------------------------------------------------------: | :-----: | :---------: |
|     ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard |         |             |

---

## Territory Analyzer

Aggregated housing market data

### Input Params

| Required? |     Name      |            Description            | Options | Defaults to |
| :-------: | :-----------: | :-------------------------------: | :-----: | :---------: |
|     ✅     | `propertyZip` | Zip code of interested properties |  U.S.   |     n/a     |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "propertyZip": 80123,
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "soldAvgPriceArry": [
      "1": 348.91,
      "2": 313.88,
      "3": 322.45,
      "4": 308.9,
      "5": 319.82,
      "6": 296.3,
      "7": 289.58
    ],
    "result": 348.91
  },
  "statusCode": 200
}
```

Array result information:

| Index |     Description |
| :---- | --------------: |
| 1     |    0 To 90 Days |
| 2     |  90 To 180 Days |
| 3     | 180 To 270 Days |
| 4     | 270 To 365 Days |
| 5     |  0 To 12 Months |
| 6     | 12 To 24 Months |
| 7     | 24 To 36 Months |