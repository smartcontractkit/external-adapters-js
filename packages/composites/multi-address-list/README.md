# MULTI_ADDRESS_LIST

![0.0.0](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/composites/multi-address-list/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Environment Variables

| Required? |            Name            |                                        Description                                         |  Type  | Options |      Default       |
| :-------: | :------------------------: | :----------------------------------------------------------------------------------------: | :----: | :-----: | :----------------: |
|    ✅     |   ANCHORAGE_ADAPTER_URL    |                                    URL of Anchorage EA                                     | string |         |                    |
|    ✅     |     BITGO_ADAPTER_URL      |                                      URL of Bitgo EA                                       | string |         |                    |
|    ✅     | COINBASE_PRIME_ADAPTER_URL |                                  URL of Coinbase Prime EA                                  | string |         |                    |
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

| Required? |   Name   |     Description     |  Type  |                Options                 |    Default     |
| :-------: | :------: | :-----------------: | :----: | :------------------------------------: | :------------: |
|           | endpoint | The endpoint to use | string | [address-list](#address-list-endpoint) | `address-list` |

## Address-list Endpoint

`address-list` is the only supported name for this endpoint.

### Input Params

| Required? |          Name           |  Aliases  |                                                                    Description                                                                    |   Type   |                     Options                     |  Default  | Depends On | Not Valid With |
| :-------: | :---------------------: | :-------: | :-----------------------------------------------------------------------------------------------------------------------------------------------: | :------: | :---------------------------------------------: | :-------: | :--------: | :------------: |
|    ✅     |        anchorage        |           |                                                       Input parameters for the Anchorage EA                                                       |  object  |                                                 |           |            |                |
|    ✅     |    anchorage.vaultId    | `vaultID` |                                                                    customerId                                                                     |  string  |                                                 |           |            |                |
|           |    anchorage.chainId    |           |                                                           The ID of the chain to return                                                           |  string  |              `mainnet`, `testnet`               | `mainnet` |            |                |
|           |    anchorage.network    |           |                                                               The network to return                                                               |  string  |                                                 | `bitcoin` |            |                |
|           |   anchorage.endpoint    |           |                                                        Endpoint name to make a request to                                                         |  string  |                                                 | `wallet`  |            |                |
|    ✅     |          bitgo          |           |                                                         Input parameters for the Bitgo EA                                                         |  object  |                                                 |           |            |                |
|    ✅     |       bitgo.coin        |           |                                                  A cryptocurrency symbol or token ticker symbol                                                   |  string  |                                                 |           |            |                |
|           |      bitgo.chainId      |           |                                                           The ID of the chain to return                                                           |  string  |              `mainnet`, `testnet`               | `mainnet` |            |                |
|           |      bitgo.network      |           |                                                               The network to return                                                               |  string  |                                                 | `bitcoin` |            |                |
|    ✅     |      bitgo.reserve      |           |                     Used to select {$reserve}_API_KEY {$reserve}\_API_ENDPOINT {$reserve}\_API_LIMIT in environment variables                     |  string  |                                                 |           |            |                |
|           |     bitgo.endpoint      |           |                                                        Endpoint name to make a request to                                                         |  string  |                                                 | `wallet`  |            |                |
|    ✅     |      coinbasePrime      |           |                                                    Input parameters for the Coinbase Prime EA                                                     |  object  |                                                 |           |            |                |
|    ✅     | coinbasePrime.portfolio |           |                                                     The portfolio ID to query the balance of                                                      |  string  |                                                 |           |            |                |
|    ✅     |  coinbasePrime.symbols  |           |                                                       The symbol to return the balance for                                                        | string[] |                                                 |           |            |                |
|           |   coinbasePrime.type    |           |                                                            The balance type to return                                                             |  string  | `trading`, `vault`, `wallet_type_other`, `web3` |  `vault`  |            |                |
|           |  coinbasePrime.chainId  |           |                                                           The ID of the chain to return                                                           |  string  |              `mainnet`, `testnet`               | `mainnet` |            |                |
|           |  coinbasePrime.network  |           |                                                               The network to return                                                               |  string  |                                                 | `bitcoin` |            |                |
|           | coinbasePrime.batchSize |           |                                                    The number of addresses to fetch at a time                                                     |  number  |                                                 |   `100`   |            |                |
|           |  coinbasePrime.apiKey   |           | Alternative api keys to use for this request, {$apiKey}_ACCESS_KEY {$apiKey}\_PASSPHRASE {$apiKey}\_SIGNING_KEY required in environment variables |  string  |                                                 |           |            |                |
|           | coinbasePrime.endpoint  |           |                                                        Endpoint name to make a request to                                                         |  string  |                                                 | `wallet`  |            |                |

### Example

There are no examples for this endpoint.

---

MIT License
