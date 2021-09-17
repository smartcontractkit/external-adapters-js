# Chainlink External Adapter for Flightaware

An example adapter description

### Environment Variables

| Required? |     Name     | Description  | Options | Defaults to |
| :-------: | :----------: | :----------: | :-----: | :---------: |
|    ✅     |   API_KEY    |   API key    |         |             |
|    ✅     | API_USERNAME | API username |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                    Options                     |     Defaults to      |
| :-------: | :------: | :-----------------: | :--------------------------------------------: | :------------------: |
|           | endpoint | The endpoint to use | [estimatedarrivaltime](#FlightInfoEx-Endpoint) | estimatedarrivaltime |

---

## FlightInfoEx Endpoint

Supports the following endpoint params to return a field in the response data:

- `estimatedarrivaltime`: Returns the estimatedarrivaltime value from the [FlightInfoEx](https://flightaware.com/commercial/aeroapi/explorer/#op_FlightInfoEx) endpoint

### Input Params

| Required? |    Name     |                           Description                           | Options | Defaults to |
| :-------: | :---------: | :-------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `departure` | The departure time of the flight as a UNIX timestamp in seconds |         |             |
|    ✅     |  `flight`   |                          The flight ID                          |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "flight": "NAX105",
    "departure": 1631817600
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 1631823964
  },
  "statusCode": 200
}
```
