# MULTI_ADDRESS_LIST

![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

Multi Address List is a composite adapter that allows you to retrieve a list of addresses from multiple underlying protocol adapters.

## Environment Variables

| Required? |            Name            |                                        Description                                         |  Type  | Options |      Default       |
| :-------: | :------------------------: | :----------------------------------------------------------------------------------------: | :----: | :-----: | :----------------: |
|           |   ANCHORAGE_ADAPTER_URL    |                                    URL of Anchorage EA                                     | string |         |                    |
|           |     BITGO_ADAPTER_URL      |                                      URL of Bitgo EA                                       | string |         |                    |
|           | COINBASE_PRIME_ADAPTER_URL |                                  URL of Coinbase Prime EA                                  | string |         |                    |
|           |       SCHEDULER_HOUR       |                                Hour to run scheduler [0-23]                                | number |         |        `17`        |
|           |     SCHEDULER_MINUTES      |                               Minute to run scheduler [0-59]                               | number |         |        `1`         |
|           |     SCHEDULER_TIMEZONE     |                                 Timezone to run scheduler                                  | string |         | `America/New_York` |
|           |     RETRY_INTERVAL_MS      |    The amount of time (in ms) to wait before re-execution if previous execution fails.     | number |         |      `60000`       |
|           |        MAX_RETRIES         |                     The number of times to retry when execution fails.                     | number |         |        `5`         |
|           |   BACKGROUND_EXECUTE_MS    | The amount of time the background execute should sleep before performing the next request. | number |         |      `10000`       |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |           Options            |  Default  |
| :-------: | :------: | :-----------------: | :----: | :--------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [address](#address-endpoint) | `address` |

## Address Endpoint

`address` is the only supported name for this endpoint.

### Input Params

| Required? |  Name   | Aliases |          Description          |  Type  |       Options        |  Default  | Depends On | Not Valid With |
| :-------: | :-----: | :-----: | :---------------------------: | :----: | :------------------: | :-------: | :--------: | :------------: |
|           | chainId |         | The ID of the chain to return | string | `mainnet`, `testnet` | `mainnet` |            |                |
|           | network |         |     The network to return     | string |                      | `bitcoin` |            |                |

**Note that this EA requires additional input parameters for each of the underlying EAs. See their respective READMEs for more information.**
**Each underlying source EA must be an object with the EA name as the key (snake case) and the parameters for the EA as the value. Please see the example below.**

### Example

Request:

```json
{
  "data": {
    "network": "bitcoin",
    "chainId": "mainnet",
    "endpoint": "address",

    // Additional parameters for each of the underlying EAs.
    "anchorage": {
      "vaultId": "b0bb2439c1e4926342ce693b4db2e683"
    },
    "bitgo": {
      "coin": "BTC",
      "reserve": "BTC"
    },
    "coinbase_prime": {
      "batchSize": 100,
      "type": "vault",
      "portfolio": "sdas22s-dssw-dsw21-2231-dje72f9sj2",
      "symbols": ["BTC"],
      "apiKey": "",
      "endpoint": "wallet"
    }
  }
}
```

---

MIT License
