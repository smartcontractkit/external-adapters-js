# Chainlink External Adapter for Lition

## Price API

Returns the price in Euros per MWh

### Endpoint

https://staking.lition.io/api/v1/energy/source/1/date/2020-10-07/hour/15/

### Sources

| Number | Source                |
| ------ | --------------------- |
| 1      | agora-energiewende.de |
| 2      | smard.de              |
| 3      | energy-charts.info    |

### Input Params

- `source`: The provider to retrieve price data from (required, e.g. "1", "2", or "3")
- `date`: The date to query formatted by `[YEAR]-[MONTH]-[DAY]` e.g. `2020-10-12`, if not provided defaults to the current UTC date (optional)
- `hour`: The hour to query (0-23), if not provided defaults to the current UTC hour (optional)

### Example Usage

```json
{ "source": "1" }
```

#### Output

```json
{
  "jobRunID": "143239",
  "data": { "price": 34.07, "source": "agora-energiewende.de", "result": 34.07 },
  "result": 34.07,
  "statusCode": 200
}
```
