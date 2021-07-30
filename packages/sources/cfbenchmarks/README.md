# Chainlink External Adapter for cfbenchmarks

### Configuration

The adapter takes the following environment variables:

| Required? |      Name      | Description | Options | Defaults to |
| :-------: | :------------: | :---------: | :-----: | :---------: |
|    ✅     | `API_USERNAME` |             |         |             |
|    ✅     | `API_PASSWORD` |             |         |             |

## Input Params

- `index`: The ID of the index to query

## Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 30363.12
  },
  "result": 30363.12,
  "statusCode": 200
}
```
