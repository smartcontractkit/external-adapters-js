# Chainlink Outlier Detection composite adapter

The outlier detection composite adapter will determine if a median value from a set of source data providers is an
outlier value compared to either the median value from a set of data providers, or the current on-chain value. If the
deviation between these values is greater than the thresholds defined, the adapter returns the current on-chain value.
If all checks passes, the adapter returns the median from the source data providers.

## Configuration

The adapter takes the following environment variables:

1. A data source adapter

   | Required? |                  Name                  |                      Description                      | Options | Defaults to |
   | :-------: | :------------------------------------: | :---------------------------------------------------: | :-----: | :---------: |
   |           |        `XBTO_DATA_PROVIDER_URL`        |        The location of a XBTO external adapter        |         |             |
   |           | `GENESIS_VOLATILITY_DATA_PROVIDER_URL` | The location of a Genesis Volatility external adapter |         |             |
   |           |       `DXFEED_DATA_PROVIDER_URL`       |       The location of a DXFeed external adapter       |         |             |

   2. A check adapter

   | Required? |                Name                 |                   Description                    | Options | Defaults to |
   | :-------: | :---------------------------------: | :----------------------------------------------: | :-----: | :---------: |
   |           |     `DERIBIT_DATA_PROVIDER_URL`     |   The location of an Deribit external adapter    |         |             |
   |           | `OILPRICEAPI_COM_DATA_PROVIDER_URL` | The location of a Oil Price API external adapter |         |             |
   |           |     `DXFEED_DATA_PROVIDER_URL`      |    The location of a DXFeed external adapter     |         |             |

   3. An ETH RPC URL to read the reference data value. Required by runlog requests.

      | Required? |   Name    |    Description    | Options | Defaults to |
      | :-------: | :-------: | :---------------: | :-----: | :---------: |
      |           | `RPC_URL` | Ethereum provider |         |             |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

### Input Params

| Required? |              Name               |                                                                    Description                                                                    |              Options               | Defaults to |
| :-------: | :-----------------------------: | :-----------------------------------------------------------------------------------------------------------------------------------------------: | :--------------------------------: | :---------: |
|    ✅     | `referenceContract`, `contract` |                                             The smart contract to read the reference data value from                                              |                                    |             |
|    ✅     |           `multiply`            |                                                  The amount to multiply the referenced value by                                                   |                                    |
|    ✅     |            `source`             | The source external adapter to use. Multiple sources can be through a `,` delimiter. (e.g. `xbto,dxfeed`) , `xbto`, `genesisvolatility`, `dxfeed` |                                    |
|    ✅     |             `asset`             |                                                      The ticker to query the data source for                                                      |                                    |
|    🟡     |             `check`             |                    The check external adapter to use. Multiple checks can be through a `,` delimiter. (e.g. `deribit,dxfeed`)                     | `deribit`, `oilpriceapi`, `dxfeed` |             |
|    🟡     |        `check_threshold`        |                                       Set a percentage deviation threshold against the check data sources.                                        |                                    |   0 (off)   |
|    🟡     |       `onchain_threshold`       |                                         Set a percentage deviation threshold against the on-chain value.                                          |                                    |   0 (off)   |

### Sample Input

#### WTI Outlier detection

```json
{
  "id": "1",
  "data": {
    "source": "xbto",
    "check": "oilpriceapi",
    "check_threshold": 10
  }
}
```

#### IV Outlier detection

```json
{
  "id": "1",
  "data": {
    "source": "genesisvolatility",
    "check": "deribit",
    "check_threshold": 30,
    "onchain_threshold": 50
  }
}
```

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
