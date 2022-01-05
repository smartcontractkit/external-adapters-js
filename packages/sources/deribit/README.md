# Chainlink External Adapter for Deribit

### Input Params

<!-- - `base`, `from`, or `coin`: The symbol of the currency to query
- `quote`, `to`, or `market`: The symbol of the currency to convert to
- `endpoint`: Optional endpoint param -->

| Required? |           Name            |             Description             | Options | Defaults to |
| :-------: | :-----------------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `base`, `from`, or `coin` | The symbol of the currency to query |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH"
  }
}
```

## Sample Output

```json
{
  "jobRunID": "1",
  "result": 66.5046281503906,
  "statusCode": 200,
  "data": {
    "result": 66.5046281503906
  }
}
```
