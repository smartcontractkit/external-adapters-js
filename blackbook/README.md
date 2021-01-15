# Chainlink External Adapter for Black Book

## Input Params

- `endpoint`: Optional endpoint param. Default: `vehicle`

### Vehicle

- `product`: The Black Book product to query (supported: `CPI`)
- `year`: The vehicle year (required for CPI)
- `make`: The vehicle make (required for CPI)
- `model`: The vehicle model (required for CPI)
- `customerid`: Optional customerid param

#### Output

```json
{
  "jobRunID": "1",
  "data": {
    "warning_count": 0,
    "error_count": 0,
    "message_list": [],
    "token_expiration_minutes": 0,
    "cpi_vehicles": {
      "cpi_vehicle_list": [
        {
          "publish_date": "8/1/2020",
          "country": "US",
          "uvc": "2016013P20",
          "model_year": "2016",
          "make": "Ferrari",
          "model": "F12 tdf Coupe",
          "fair": 700000,
          "excellent": 1000000,
          "good": 850000
        }
      ],
      "template": 1,
      "version": 1,
      "data_included": true,
      "data_available": true
    },
    "result": 850000
  },
  "result": 850000,
  "statusCode": 200
}
```
