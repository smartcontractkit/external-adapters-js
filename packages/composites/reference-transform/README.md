# Reference Transform composite adapter

Reference Transform adapters read the value from a given reference feed before using that value to transform the result from the data provider.

## Configuration

The adapter takes the following environment variables:

| Required? |             Name             |                                 Description                                 | Options | Defaults to |
| :-------: | :--------------------------: | :-------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     | `{SOURCE}_DATA_PROVIDER_URL` | The URL location for the price data provider adapter when `source={SOURCE}` |         |             |
|    ✅     |          `RPC_URL`           |                ETH RPC URL to read the reference data value                 |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input params

| Required? |        Name         |                       Description                        |         Options         | Defaults to |
| :-------: | :-----------------: | :------------------------------------------------------: | :---------------------: | :---------: |
|    ✅     |      `source`       |   The source external adapter to request a value from    |                         |             |
|    ✅     | `referenceContract` |        The reference contract to get a value from        |                         |             |
|    ✅     |     `operator`      |     The operator to use for the value transformation     |   `multiply`,`divide`   |             |
|    🟡     |     `multiply`      |          Multiply amount for the on-chain value          |                         |  100000000  |
|    🟡     |     `dividend`      | Which value to use as dividend when operator is "divide" | `on-chain`, `off-chain` | `off-chain` |

In addition to these parameters the input parameters to make a request to the source will need to be provided. Please see the specified source's README for more details.

### Sample Input

```json
{
  "jobID": "1",
  "data": {}
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 0
  },
  "result": 0,
  "statusCode": 200
}
```
