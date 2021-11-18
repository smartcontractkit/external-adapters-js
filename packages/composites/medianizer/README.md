# Chainlink Medianizer Composite Adapter

An adapter that fetches the median value from any set of underlying adapters.

This composite adapter should only be used temporarily until the Chainlink core job pipeline can support native
medianizer for any job types.

## Configuration

The adapter takes the following environment variables:

| Required? |          Name          |                 Description                 | Options | Defaults to |
| :-------: | :--------------------: | :-----------------------------------------: | :-----: | :---------: |
|           | `ADAPTER_URL_[source]` | The adapter URL to query for any `[source]` |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |     Name     |                         Description                          | Options | Defaults to |
| :-------: | :----------: | :----------------------------------------------------------: | :-----: | :---------: |
|    ✅     |  `sources`   | An array or comma delimited list of source adapters to query |         |             |
|           | `minAnswers` |    The minimum amount of answers needed to return a value    |         |     `1`     |

Each source in `sources` needs to have a defined `ADAPTER_URL_*` defined as an env var.

_E.g. for a request with `"sources": ["coingecko", "coinpaprika"]`, you will need to have pre-set the following env vars:_

```
ADAPTER_URL_COINGECKO=https://ADAPTER_URL_COINGECKO/
ADAPTER_URL_COINPAPRIKA=https://ADAPTER_URL_COINPAPRIKA/
```

### Sample Input

```json
{
  "id": "1",
  "data": {
    "base": "ETH",
    "quote": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "price": 77777.77,
    "result": 77777.77
  },
  "statusCode": 200
}
```
