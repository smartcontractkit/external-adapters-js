# Chainlink Implied-price Composite Adapter

An adapter that fetches the median value from any two sets of underlying adapters, and divides or multiplied the results from each set together.

## Configuration

The adapter takes the following environment variables:

| Required? |          Name          |                 Description                 | Options | Defaults to |
| :-------: | :--------------------: | :-----------------------------------------: | :-----: | :---------: |
|           | `[source]_ADAPTER_URL` | The adapter URL to query for any `[source]` |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### computedPrice endpoint

#### Input Params

| Required? |         Name         |                                               Description                                               |         Options          | Defaults to |
| :-------: | :------------------: | :-----------------------------------------------------------------------------------------------------: | :----------------------: | :---------: |
|    ✅     |  `operand1Sources`   | An array (string[]) or comma delimited list (string) of source adapters to query for the operand1 value |                          |             |
|           | `operand1MinAnswers` |                 The minimum number of answers needed to return a value for the operand1                 |                          |     `1`     |
|    ✅     |   `operand1Input`    |                               The payload to send to the operand1 sources                               |                          |             |
|    ✅     |  `operand2Sources`   | An array (string[]) or comma delimited list (string) of source adapters to query for the operand2 value |                          |             |
|           | `operand2MinAnswers` |                 The minimum number of answers needed to return a value for the operand2                 |                          |     `1`     |
|    ✅     |   `operand2Input`    |                               The payload to send to the operand2 sources                               |                          |             |
|    ✅     |     `operation`      |                               The payload to send to the operand2 sources                               | `"divide"`, `"multiply"` |             |

Each source in `sources` needs to have a defined `*_ADAPTER_URL` defined as an env var.

_E.g. for a request with `"operand1Sources": ["coingecko", "coinpaprika"]`, you will need to have pre-set the following env vars:_

```
COINGECKO_ADAPTER_URL=https://coingecko_adapter_url/
COINPAPRIKA_ADAPTER_URL=https://coinpaprika_adapter_url/
```

#### Sample Input

```json
{
  "id": "1",
  "data": {
    "operand1Sources": ["coingecko"],
    "operand2Sources": ["coingecko"],
    "operand1Input": {
      "from": "LINK",
      "to": "USD",
      "overrides": {
        "coingecko": {
          "LINK": "chainlink"
        }
      }
    },
    "operand2Input": {
      "from": "ETH",
      "to": "USD",
      "overrides": {
        "coingecko": {
          "ETH": "ethereum"
        }
      }
    },
    "operation": "divide"
  }
}
```

#### Sample Output

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

### impliedPrice endpoint

This legacy endpoint is the default endpoint for backward compatibility.

#### Input Params

| Required? |         Name         |                                               Description                                               | Options | Defaults to |
| :-------: | :------------------: | :-----------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |  `dividendSources`   | An array (string[]) or comma delimited list (string) of source adapters to query for the dividend value |         |             |
|           | `dividendMinAnswers` |                 The minimum number of answers needed to return a value for the dividend                 |         |     `1`     |
|    ✅     |   `dividendInput`    |                               The payload to send to the dividend sources                               |         |             |
|    ✅     |   `divisorSources`   | An array (string[]) or comma delimited list (string) of source adapters to query for the divisor value  |         |             |
|           | `divisorMinAnswers`  |                 The minimum number of answers needed to return a value for the divisor                  |         |     `1`     |
|    ✅     |    `divisorInput`    |                               The payload to send to the divisor sources                                |         |             |

Each source in `sources` needs to have a defined `*_ADAPTER_URL` defined as an env var.

_E.g. for a request with `"dividendSources": ["coingecko", "coinpaprika"]`, you will need to have pre-set the following env vars:_

```
COINGECKO_ADAPTER_URL=https://coingecko_adapter_url/
COINPAPRIKA_ADAPTER_URL=https://coinpaprika_adapter_url/
```

#### Sample Input

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

#### Sample Output

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
