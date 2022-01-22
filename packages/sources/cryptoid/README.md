# Chainlink External Adapter for cryptoID

### Configuration

The adapter takes the following environment variables:

| Required? |  Name   | Description | Options | Defaults to |
| :-------: | :-----: | :---------: | :-----: | :---------: |
|           | API_KEY |             |         |             |

---

## Input Params

- `blockchain` or `coin`: The blockchain name (required).
- `endpoint`: The requested data point. One of (`difficulty`|`height`). Defaults: `difficulty`.

## Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 19298087186262.6
  },
  "result": 19298087186262.6,
  "statusCode": 200
}
```
