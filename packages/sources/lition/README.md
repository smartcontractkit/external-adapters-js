# Chainlink External Adapter for Lition

### Input Parameters

| Required? |   Name   |     Description     |          Options           | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------: | :---------: |
|           | endpoint | The endpoint to use | [energy](#Energy-Endpoint) |   energy    |

---

## Energy Endpoint

Returns the price in Euros per MWh

### Sources

| Number | Source                |
| ------ | --------------------- |
| 1      | agora-energiewende.de |
| 2      | smard.de              |
| 3      | energy-charts.info    |

### Input Params

| Required? |   Name   |                                Description                                |  Options   |     Defaults to      |
| :-------: | :------: | :-----------------------------------------------------------------------: | :--------: | :------------------: |
|    ✅     | `source` |     The provider to retrieve price data from (e.g. "1", "2", or "3")      |            |                      |
|           |  `date`  | The date to query formatted by `[YEAR]-[MONTH]-[DAY]` (e.g. `2020-10-12`) |            | The current UTC date |
|           |  `hour`  |                             The hour to query                             | `0` - `23` | The current UTC hour |

### Sample Input

```json
{
  "id": "1",
  "data": { "source": "1" }
}
```

### Sample Output

```json
{
  "jobRunID": "143239",
  "data": { "price": 34.07, "source": "agora-energiewende.de", "result": 34.07 },
  "result": 34.07,
  "statusCode": 200
}
```
