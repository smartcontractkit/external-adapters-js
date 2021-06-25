# Chainlink External Adapter for Cpc-rainfall

### Environment Variables

| Required? |  Name   |                                                        Description                                                         | Options | Defaults to |
| :-------: | :-----: | :------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|     ✅     | API_KEY | An API key that can be obtained from the data provider's dashboard 
|            | CHAINLINK_URL | The URL of the Chainlink Node to call to resume job                                                                 |         | http://localhost:6688 |
|     ✅     | CALLBACK_URL | The URL that the CPC service will callback 
|     ✅     | INCOMING_TOKEN | Authentication that can be retrieved after adding the adapter from the node's bridge 
|         |             |

---

### Input Parameters

No input paramters required

---

## Cpc-rainfall Endpoint


### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `contract_id`              |                                          |                     |         
|    ✅     | `weather_type`             | The weather type to search for           |                     |
|    ✅     | `start_date`               | The start date to filter from            |                     |
|    ✅     | `end_date`                 | The end date to filter to                |                     |
|    ✅     | `notional_amount`          |                                          |                     | 
|    ✅     | `exit`                     |                                          |                     |
|    ✅     | `coordinates`              |                                          |                     |
|    ✅     | `edge_length`              |                                          |                     |
|    ✅     | `threshold_factory`        |                                          |                     |
|    ✅     | `secret`                   |                                          |                     |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "contract_id": "xRvzgt6EKvneQfNy6",
    "weather_type": "low_rainfall",
    "start_date": 1560211199,
    "end_date": 1563753599,
    "notional_amount": 4.5,
    "exit": 70,
    "coordinates": "38.50, 280.50",
    "edge_length": 0.25,
    "threshold_factor": 112,
    "secret": 1
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {},
  "statusCode": 200,
  "pending": true
}
```

### Sample Call From Callback endpoint to Chainlink Node

PATCH Request

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "pending": false,
    "data": {
      "...to be filled in once we can the CPC API has been fixed and we can see what is returned"
    }
  }
}
```