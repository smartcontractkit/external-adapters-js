# Chainlink External Adapter for US Consumer Price Index (USCPI)

---

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [series](#Series-Endpoint) |   series    |

---

## Series Endpoint

### Input Params

| Required? |  Name   |       Description       |              Options              |  Defaults to  |
| :-------: | :-----: | :---------------------: | :-------------------------------: | :-----------: |
|           | `serie` | The US CPI Data serieID | `CUSR0000SA0`, `LNS14000000`, etc | `CUSR0000SA0` |
|           | `month` | The month serie filter  |        `may`, `july`, etc         |               |
|           | `year`  |  The year serie filter  |        `2021`, `2020`, etc        |               |

It is mandatory to specify the `month` and `year` values together.

### Sample Input

```json
{
  "id": "1",
  "data": {
    "serie": "CUSR0000SA0",
    "month": "July",
    "year": "2021"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 272.3,
  "statusCode": 200,
  "data": {
    "result": 272.3
  }
}
```
