# Bitcoin Proof-of-Reserves Indexer Service Adapter

The adapter provides an interface for retrieving total reserves for sets of addresses a Bitcoin PoR Indexer Service.

## Configuration

The adapter takes the following environment variables:

| Required? |                 Name                  |                             Description                              | Options |       Defaults to       |
| :-------: | :-----------------------------------: | :------------------------------------------------------------------: | :-----: | :---------------------: |
|           |     `BTC_MAINNET_POR_INDEXER_URL`     |                 Bitcoin PoR Indexer Service endpoint                 |         | `http://localhost:8080` |
|           | `[NETWORK]_[CHAINID]_POR_INDEXER_URL` | PoR Indexer Service endpoint for any other network to be implemented |         |                         |

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

- `endpoint`: The parameter to query for. Default: "index"

### Input Params

| Required? |        Name        |                    Description                    | Options | Defaults to |
| :-------: | :----------------: | :-----------------------------------------------: | :-----: | :---------: |
|    ✅     |    `adddresses`    | Address set for which to calculate total reserves |         |             |
|           | `minConfirmations` |       Minimum number of block confirmations       |         |     `0`     |

`addresses` is an array of strings of Bitcoin addresses that represent a reserve. See example below:

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "endpoint": "index",
    "addresses": ["39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE", "35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR"],
    "minConfirmations": 0
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "statusCode": 200,
  "data": {
    "result": "105049.28265606"
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
