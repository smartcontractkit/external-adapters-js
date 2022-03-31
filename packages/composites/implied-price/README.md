# Chainlink Implied-price Composite Adapter

An adapter that fetches the median value from any two sets of underlying adapters, and divides the results from each set together.

## Configuration

The adapter takes the following environment variables:

| Required? |          Name          |                 Description                 | Options | Defaults to |
| :-------: | :--------------------: | :-----------------------------------------: | :-----: | :---------: |
|           | `[source]_ADAPTER_URL` | The adapter URL to query for any `[source]` |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |         Name         |                                               Description                                               | Options | Defaults to |
| :-------: | :------------------: | :-----------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |  `dividendSources`   | An array (string[]) or comma delimited list (string) of source adapters to query for the dividend value |         |             |
|           | `dividendMinAnswers` |                 The minimum number of answers needed to return a value for the dividend                 |         |     `1`     |
|           |   `dividendInput`    |                               The payload to send to the dividend sources                               |         |    `{}`     |
|    ✅     |   `divisorSources`   | An array (string[]) or comma delimited list (string) of source adapters to query for the divisor value  |         |             |
|           | `divisorMinAnswers`  |                 The minimum number of answers needed to return a value for the divisor                  |         |     `1`     |
|           |    `divisorInput`    |                               The payload to send to the divisor sources                                |         |    `{}`     |

Each source in `sources` needs to have a defined `*_ADAPTER_URL` defined as an env var.

_E.g. for a request with `"dividendSources": ["coingecko", "coinpaprika"]`, you will need to have pre-set the following env vars:_

```
COINGECKO_ADAPTER_URL=https://coingecko_adapter_url/
COINPAPRIKA_ADAPTER_URL=https://coinpaprika_adapter_url/
```

### Sample Input

```json
{
  "id": "1",
  "data": {
    "dividendSources": ["coingecko"],
    "divisorSources": ["coingecko"],
    "dividendInput": {
      "from": "LINK",
      "to": "USD",
      "overrides": {
        "coingecko": {
          "LINK": "chainlink"
        }
      }
    },
    "divisorInput": {
      "from": "ETH",
      "to": "USD",
      "overrides": {
        "coingecko": {
          "ETH": "ethereum"
        }
      }
    }
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "0.005204390891874140333",
  "statusCode": 200,
  "data": {
    "result": "0.005204390891874140333"
  }
}
```
