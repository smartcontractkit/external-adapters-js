# Chainlink External Adapter for Stasis

Version: 1.1.1

Stasis adapter to get Circulating Supply of EURS

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |          Options           | Default  |
| :-------: | :------: | :-----------------: | :----: | :------------------------: | :------: |
|           | endpoint | The endpoint to use | string | [supply](#supply-endpoint) | `supply` |

---

## Supply Endpoint

`supply` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "id": "1",
  "data": {}
}
```

Response:

```json
{
  "result": 89225940
}
```
