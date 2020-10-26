# Chainlink External Adapter for Lition

## Price API

### Endpoint

https://staking.lition.io/api/v1/energy/source/1/date/2020-10-07/hour/15/

### Input Params

- `source`: The provider to retrieve price data from (required, e.g. "1", "2", or "3")

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
