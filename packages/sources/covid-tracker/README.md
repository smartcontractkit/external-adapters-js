# Chainlink COVID Tracker External Adapter

Version: 1.2.16

Notice: The COVID Tracking Project is ending all data collection on March 7, 2021. The existing API will continue to work until May 2021, but will only include data up to March 7, 2021.

This README was generated automatically. Please see [scripts](../../scripts) for more info.

## Environment Variables

There are no environment variables for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |      Options       | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------: | :-----: |
|           | endpoint | The endpoint to use | string | [us](#us-endpoint) |  `us`   |

---

## Us Endpoint

`us` is the only supported name for this endpoint.

### Input Params

| Required? | Name | Aliases |                              Description                              | Type | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :-------------------------------------------------------------------: | :--: | :-----: | :-----: | :--------: | :------------: |
|           | date |         | The date to query formatted by `[YEAR][MONTH][DAY]` (e.g. `20201012`) |      |         |         |            |                |

### Example

Request:

```json
{
  "id": "1",
  "data": {
    "endpoint": "us",
    "resultPath": "death"
  }
}
```

Response:

```json
{
  "result": 515151
}
```

---
