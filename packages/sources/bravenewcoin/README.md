# Chainlink External Adapter for BraveNewCoin

### Input Parameters

| Required? |   Name   |     Description     |           Options            | Defaults to |
| :-------: | :------: | :-----------------: | :--------------------------: | :---------: |
|           | endpoint | The endpoint to use | [crypto](#Crypto-Endpoint) |   example   |

### Configuration

The adapter takes the following environment variables:

| Required? |    Name     | Description | Options | Defaults to |
| :-------: | :---------: | :---------: | :-----: | :---------: |
|    ✅     |  `API_KEY`  |             |         |             |
|    ✅     | `CLIENT_ID` |             |         |             |

---

## Crypto endpoint
##### NOTE: the `price` endpoint is temporarily still supported, however, is being deprecated. Please use the `crypto` endpoint instead.
[BraveNewCoin's AssetTicker endpoint](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_836afc67-19d2-45ae-bb56-c576cec9f602)

### Input Params

| Required? |            Name            |               Description                |       Options       | Defaults to |
| :-------: | :------------------------: | :--------------------------------------: | :-----------------: | :---------: |
|    ✅     | `base`, `from`, or `coin`  |   The symbol of the currency to query    | `BTC`, `ETH`, `USD` |             |
|    ✅     | `quote`, `to`, or `market` | The symbol of the currency to convert to | `BTC`, `ETH`, `USD` |

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": 8.533507688737274
  },
  "result": 8.533507688737274,
  "statusCode": 200
}
```

---

## VWAP endpoint

[BraveNewCoin's 24 Hour USD VWAP](https://rapidapi.com/BraveNewCoin/api/bravenewcoin?endpoint=apiendpoint_8b8774ba-b368-4399-9c4a-dc78f13fc786)

### Input Params

| Required? |                                Name                                |                                                                       Description                                                                       |   Options    | Defaults to |
| :-------: | :----------------------------------------------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------------: | :----------: | :---------: |
|    ✅     | `base`, `from`, `coin`, `symbol`, `assetId`, `indexId`, or `asset` |                                             Retrieve all the OHLCV values for a particular asset or market                                              |              |             |
|           |                            `indexType`                             |                                                      Restrict the OHLCV results to the index type.                                                      | `MWA`, `GWA` |    `GWA`    |
|           |                            `timestamp`                             | Retrieve all daily OHLCV records from the timestamp provided. All dates are stored in UTC. Timestamp strings should be in the form YYYY-MM-DDThh:mm:ssZ |              |             |

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "content": [
      {
        "indexId": "551cdbbe-2a97-4af8-b6bc-3254210ed021",
        "indexType": "GWA",
        "open": 1.9248204798140678,
        "high": 2.5557035027423054,
        "low": 1.891225386234147,
        "close": 2.4208656452222885,
        "volume": 665942.7213355688,
        "vwap": 2.12777657752828,
        "twap": 2.07318626293901,
        "startTimestamp": "2020-07-08T00:00:00Z",
        "endTimestamp": "2020-07-08T23:59:59.999Z",
        "timestamp": "2020-07-08T00:00:00Z",
        "id": "637e68c3-681f-49c2-a69f-c239c14e1d18"
      }
    ],
    "nextId": "637e68c3-681f-49c2-a69f-c239c14e1d18",
    "result": 2.12777657752828
  },
  "result": 2.12777657752828,
  "statusCode": 200
}
```
