# POR_INDEXER

![2.3.2](https://img.shields.io/github/package-json/v/smartcontractkit/external-adapters-js?filename=packages/sources/por-indexer/package.json) ![v3](https://img.shields.io/badge/framework%20version-v3-blueviolet)

This document was generated automatically. Please see [README Generator](../../scripts#readme-generator) for more info.

## Known Issues

### Dependencies

The `por-indexer` balance endpoint queries the **streams Bitcoin indexer**, an Electrs-compatible REST API. Use the same base URL as `BITCOIN_RPC_ENDPOINT` in the `dlc-cbtc-por` adapter. Dogecoin is not supported.

See [custom.md](./docs/custom.md) for more details.

### MAX_PAYLOAD_SIZE_LIMIT configuration

The `MAX_PAYLOAD_SIZE_LIMIT` environment variable is used for controlling the maximum size of the incoming request body that the EA can handle. If you decided to customize this value it's essential to ensure that any reverse proxy or web server in front of the EA, such as Nginx, is also configured with a corresponding limit. This alignment prevents scenarios where Nginx rejects a request for exceeding its payload size limit before it reaches the EA.

## Environment Variables

| Required? |          Name           |                                        Description                                        |  Type  | Options |                               Default                               |
| :-------: | :---------------------: | :---------------------------------------------------------------------------------------: | :----: | :-----: | :-----------------------------------------------------------------: |
|           | BITCOIN_MAINNET_RPC_URL |             Streams Bitcoin indexer endpoint for Bitcoin mainnet UTXO queries             | string |         |                                 ``                                  |
|           | BITCOIN_TESTNET_RPC_URL |             Streams Bitcoin indexer endpoint for Bitcoin testnet UTXO queries             | string |         |                                 ``                                  |
|           |    ZEUS_ZBTC_API_URL    |                                   API url for zeus zBTC                                   | string |         | `https://hermes.zeusnetwork.xyz/api/v2/chainlink/proof-of-reserves` |
|           |       BATCH_SIZE        |  Number of addresses to query concurrently against the streams Bitcoin indexer per batch  | number |         |                                `10`                                 |
|           |  BACKGROUND_EXECUTE_MS  | The amount of time the background execute should sleep before performing the next request | number |         |                               `10000`                               |

---

## Data Provider Rate Limits

There are no rate limits for this adapter.

---

## Input Parameters

| Required? |   Name   |     Description     |  Type  |                                             Options                                              |  Default  |
| :-------: | :------: | :-----------------: | :----: | :----------------------------------------------------------------------------------------------: | :-------: |
|           | endpoint | The endpoint to use | string | [balance](#balance-endpoint), [index](#balance-endpoint), [zeusminerfee](#zeusminerfee-endpoint) | `balance` |

## Balance Endpoint

Supported names for this endpoint are: `balance`, `index`.

Balances are calculated by querying UTXOs from the streams Bitcoin indexer and filtering by `minConfirmations` using block height.

### Input Params

| Required? |       Name        | Aliases  |                                             Description                                              |   Type   |        Options        | Default | Depends On | Not Valid With |
| :-------: | :---------------: | :------: | :--------------------------------------------------------------------------------------------------: | :------: | :-------------------: | :-----: | :--------: | :------------: |
|    ✅     |     addresses     | `result` |  An array of addresses to get the balances of (as an object with string `address` as an attribute)   | object[] |                       |         |            |                |
|    ✅     | addresses.address |          |                                   an address to get the balance of                                   |  string  |                       |         |            |                |
|    ✅     | addresses.network |          |                               The name of the target network protocol                                |  string  | `bitcoin`, `dogecoin` |         |            |                |
|    ✅     | addresses.chainId |          |                                     The name of the target chain                                     |  string  | `mainnet`, `testnet`  |         |            |                |
|           | minConfirmations  |          | Number of blocks that must have been confirmed after the point against which the balance is checked. |  number  |                       |         |            |                |

### Example

Request:

```json
{
  "data": {
    "endpoint": "balance",
    "addresses": [
      {
        "address": "bc1qlh50jpjrrlcuy6sslrucksjg22h6e0d65ken6sc54exfkrln932snwg523",
        "chainId": "mainnet",
        "network": "bitcoin"
      }
    ],
    "minConfirmations": 6
  }
}
```

---

## Zeusminerfee Endpoint

`zeusminerfee` is the only supported name for this endpoint.

### Input Params

There are no input parameters for this endpoint.

### Example

Request:

```json
{
  "data": {
    "endpoint": "zeusMinerFee"
  }
}
```

---

MIT License
