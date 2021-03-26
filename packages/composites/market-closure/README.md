# Chainlink Market Closure composite adapter

Market Closure composite adapter adds an extra check to see if trading is halted or not for the asset that's queried. It
allows for multiple checks and multiple price data provider.

If the market check provider fails, it will automatically fall
back to checking the provided schedule. If there is no schedule set it will default the market as open.

If the market is closed, the adapter will fetch the latest on-chain value from the reference contract.

## Configuration

The adapter takes the following environment variables:

| Required? |                    Name                     |                                 Description                                 | Options | Defaults to |
| :-------: | :-----------------------------------------: | :-------------------------------------------------------------------------: | :-----: | :---------: |
|    🟡     | `CHECK_API_KEY` (when using `tradinghours`) |                 An API key when needed by a check provider                  |         |             |
|    ✅     |        `{SOURCE}_DATA_PROVIDER_URL`         | The URL location for the price data provider adapter when `source={SOURCE}` |         |             |
|    ✅     |                  `RPC_URL`                  |                ETH RPC URL to read the reference data value                 |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |              Name               |                                          Description                                          |          Options           | Defaults to |
| :-------: | :-----------------------------: | :-------------------------------------------------------------------------------------------: | :------------------------: | :---------: |
|    ✅     |             `check`             |                           The provider to check if a market is open                           | `schedule`, `tradinghours` |             |
|    ✅     |            `source`             |                            The source data provider for the price                             |                            |             |
|    ✅     | `referenceContract`, `contract` |                 The Aggregator contract to call for its latest round's price                  |                            |             |
|    ✅     |           `multiply`            | To handle big numbers, the amount to divide the output from reading the reference contract by |                            |             |
|    🟡     |           `schedule`            |                   A schedule of market times to check whether they are open                   |                            |             |

Additionally, the underlying adapter may have parameters.

For example Finnhub uses the following:

| Required? |           Name            |         Description          | Options | Defaults to |
| :-------: | :-----------------------: | :--------------------------: | :-----: | :---------: |
|    ✅     | `base`, `asset` or `from` | The target currency to query |         |             |
|    🟡     |        `endpoint`         |     The endpoint to call     |         |             |

An example schedule looks like:

```json
{
  "timezone": "Europe/Oslo",
  "hours": {
    "monday": ["00:00-24:00"],
    "tuesday": ["00:00-24:00"],
    "wednesday": ["00:00-24:00"],
    "thursday": ["00:00-24:00"],
    "friday": ["00:00-24:00"],
    "saturday": ["00:00-24:00"],
    "sunday": ["00:00-24:00"]
  },
  "holidays": [
    {
      "year": 2020,
      "month": 5,
      "day": 8,
      "hours": "12:00-24:00"
    }
  ]
}
```

### Sample Input

### Sample Output
