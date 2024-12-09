# GMX_GLV

![1.1.10](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/gm-token/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |            Name             |                                        Description                                        |  Type  | Options |                   Default                    |
| :-------: | :-------------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :------------------------------------------: |
|    ✅     |      ARBITRUM_RPC_URL       |                                 RPC url of Arbitrum node                                  | string |         |                                              |
|    ✅     |      ARBITRUM_CHAIN_ID      |                                The chain id to connect to                                 | number |         |                   `42161`                    |
|    ✅     | DATASTORE_CONTRACT_ADDRESS  |                              Address of Data Store contract                               | string |         | `0xFD70de6b91282D8017aA4E741e9Ae325CAb992d8` |
|    ✅     |   READER_CONTRACT_ADDRESS   |                                Address of Reader contract                                 | string |         | `0xf60becbba223EEA9495Da3f606753867eC10d139` |
|    ✅     | GLV_READER_CONTRACT_ADDRESS |                              Address of Glv Reader contract                               | string |         | `0x6a9505D0B44cFA863d9281EA5B0b34cB36243b45` |
|    ✅     |       PNL_FACTOR_TYPE       |     PnL factor type. See https://github.com/gmx-io/gmx-synthetics#market-token-price      | string |         |         `MAX_PNL_FACTOR_FOR_TRADERS`         |
|    ✅     |     TIINGO_ADAPTER_URL      |                                     URL of Tiingo EA                                      | string |         |                                              |
|    ✅     |      NCFX_ADAPTER_URL       |                                      URL of NCFX EA                                       | string |         |                                              |
|    ✅     |   COINMETRICS_ADAPTER_URL   |                                   URL of Coinmetrics EA                                   | string |         |                                              |
|    ✅     | MIN_REQUIRED_SOURCE_SUCCESS |          Minimum number of source EAs that need to successfully return a value.           | number |         |                     `2`                      |
|           |    BACKGROUND_EXECUTE_MS    | The amount of time the background execute should sleep before performing the next request | number |         |                   `10000`                    |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |         Options          | Default |
| :-------: | :------: | :-----------------: | :----: | :----------------------: | :-----: |
|           | endpoint | The endpoint to use | string | [price](#price-endpoint) | `price` |

## Price Endpoint

`price` is the only supported name for this endpoint.

### Input Params

| Required? | Name | Aliases |     Description      |  Type  | Options | Default | Depends On | Not Valid With |
| :-------: | :--: | :-----: | :------------------: | :----: | :-----: | :-----: | :--------: | :------------: |
|    ✅     | glv  |         | Glv contract address | string |         |         |            |                |

### Example

Request:

```json
{
  "data": {
    "glv": "0x528A5bac7E746C9A509A1f4F6dF58A03d44279F9"
  }
}
```

---

MIT License
