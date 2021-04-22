# Chainlink External Adapter to Aggregate Data from Source Adapters

Aggregator requests data from existing source adapters and aggregates them using the reduce adapter to return a single number.

reduce
nomics coinapi coingecko kaiko cryptocompare amberdata coinpaprika coinmarketcap tiingo

## Configuration

The adapter requires the following environment variables:

| Required? |            Name            |                                         Description                                         | Options |      Defaults to       |
| :-------: | :------------------------: | :-----------------------------------------------------------------------------------------: | :-----: | :--------------------: |
|    ✅     |      `DATA_PROVIDERS`      |                                The external adapters to use                                 |         |                        |
|    ✅     | `REDUCE_DATA_PROVIDER_URL` |                               The URL of the external adapter                               |         |                        |
|    ✅     |   `*_DATA_PROVIDER_URL`    | The URL of an the respective external adapter (must match the adapters in `DATA_PROVIDERS`) |         |                        |
|           |        `DATA_PATHS`        |          Parameter used to read output from underlying EAs (see below for sample)           |         | `result` (for all EAs) |

For example to setup a price aggregator the environment variables may look like:

```bash
DATA_PROVIDERS=coingecko,coinpaprika
REDUCE_DATA_PROVIDER_URL=http://localhost:4000
COINGECKO_DATA_PROVIDER_URL=http://localhost:3000
COINPAPRIKA_DATA_PROVIDER_URL=http://localhost:3001
```

Underlying adapters may need to be configured with the `EA_PORT` environment variable in addition to their expected parameters.

Example `DATA_PATHS` variable:

```
DATA_PATHS=coingecko:data/result,coinpaprika:data/result
```

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started. The sample shown follows the above example of using coingecko and coinpaprika adapters.

### Input Params

| Required? |     Name     |                          Description                           |                      Options                       | Defaults to |
| :-------: | :----------: | :------------------------------------------------------------: | :------------------------------------------------: | :---------: |
|    ✅     |  `reducer`   |                    The reduce EA parameter                     | `sum`, `product`, `min`, `max`, `average`, `median` |  `average`  |
|           | other params | Other parameters will be passed directly to EAs for validation |                                                    |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "coin": "btc",
    "to": "USD"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "54158.96499997",
  "statusCode": 200,
  "data": {
    "result": "54158.96499997",
    "providers": {
      "coingecko": 54146,
      "coinpaprika": 54171.92999994
    }
  }
}
```
