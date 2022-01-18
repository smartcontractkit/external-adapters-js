# Proof-of-Reserves Indexer Service Adapter

The adapter provides an interface for retrieving total reserves for sets of addresses from a PoR Indexer Service.

## Configuration

The adapter takes the following environment variables:

| Required? |                 Name                  |                             Description                              | Options |       Defaults to       |
| :-------: | :-----------------------------------: | :------------------------------------------------------------------: | :-----: | :---------------------: |
|           |   `BITCOIN_MAINNET_POR_INDEXER_URL`   |                 Bitcoin PoR Indexer Service endpoint                 |         | `http://localhost:8080` |
|           | `[NETWORK]_[CHAINID]_POR_INDEXER_URL` | PoR Indexer Service endpoint for any other network to be implemented |         |                         |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

- `endpoint`: The parameter to query for. Default: "index"

### Input Params

| Required? |        Name        |                                                            Description                                                            | Options | Defaults to |
| :-------: | :----------------: | :-------------------------------------------------------------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |    `adddresses`    | Address set for which to calculate total reserves - See `PorInputAddress.ts` in the `proof-of-reserves` adapter for the interface |         |             |
|           | `minConfirmations` |                                               Minimum number of block confirmations                                               |         |     `0`     |

`addresses` is an array of strings of Bitcoin addresses that represent a reserve. See example below:

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "endpoint": "index",
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

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "26678537601804",
  "statusCode": 200,
  "data": {
    "result": "26678537601804"
  }
}
```

## Testing

Testing is dependent on the type of node you're connecting to. You can set a local environment variable `BITCOIN_RPC_URL` to point to an RPC connection. Otherwise, the adapter will default to `"http://localhost:8545"`.

RPC Address and Port Defaults:

- BTC: (bitcoind) http://localhost:8332 (btcd) http://localhost:8334

Make sure you run these commands from the ROOT of this monorepo.

```bash
yarn test por-indexer
```
