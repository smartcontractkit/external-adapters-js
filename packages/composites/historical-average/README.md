# Chainlink Historical Average Composite Adapter

A composite adapter to get the historical average price.

## Configuration

The adapter takes the following environment variables:

| Required? |            Name             |                        Description                        | Options | Defaults to |
| :-------: | :-------------------------: | :-------------------------------------------------------: | :-----: | :---------: |
|           | `COINMARKETCAP_ADAPTER_URL` |     The location of a CoinMarketCap external adapter      |         |             |
|           |      `DEFAULT_SOURCE`       | The default source to be used if not specified in request |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |            Name            |                                    Description                                    |       Options       | Defaults to |
| :-------: | :------------------------: | :-------------------------------------------------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |                        The symbol of the currency to query                        | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` |                     The symbol of the currency to convert to                      | `BTC`, `ETH`, `USD` |             |
|           |          `source`          |     The data provider to query. This is required if not specified in config.      |   `coinmarketcap`   |             |
|           |         `fromDate`         | The date to query from. This is required if both `toDate` and `days` are not set. |                     |             |
|           |          `toDate`          | The date to query to. This is required if both `fromDate` and `days` are not set. |                     |             |
|           |         `interval`         |            The historical interval to request from the data provider.             |                     |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "from": "ETH",
    "to": "USD",
    "fromDate": "2021-11-01",
    "toDate": "2021-11-08",
    "source": "coinmarketcap"
  }
}
```

This is the same as sending:

```json
{
  "jobID": "1",
  "data": {
    "from": "ETH",
    "to": "USD",
    "fromDate": "2021-11-01",
    "days": 7,
    "source": "coinmarketcap"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": 4484.818684096882,
  "statusCode": 200,
  "data": {
    "result": 4484.818684096882
  }
}
```
