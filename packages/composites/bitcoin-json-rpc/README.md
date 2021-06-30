# Bitcoin JSON-RPC Blockchain info adapter for Chainlink

The adapter provides an interface for retrieving data from the Bitcoin blockchain.

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |       Description       | Options |       Defaults to       |
| :-------: | :-------: | :---------------------: | :-----: | :---------------------: |
|           | `RPC_URL` | Blockchain RPC endpoint |         | `http://localhost:8332` |

Other common `RPC_URL` endpoints:

- bitcoind: http://localhost:8332
- btcd: http://localhost:8334


## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

- `endpoint`: The parameter to query for. Default: "difficulty"

### Input Params

| Required? |    Name    |      Description       | Options | Defaults to  |
| :-------: | :--------: | :--------------------: | :-----: | :----------: |
|  | `endpoint` | RPC method to call | `difficulty`, `getblockchaininfo` | `getblockchaininfo` |
|  | `field` | Parameter to query for |  | `difficulty` |


## `getblockchaininfo` Endpoint

Calls `"method": "getblockchaininfo"` on the Bitcoin node.

### Input Params

| Required? |    Name    |      Description       | Options | Defaults to  |
| :-------: | :--------: | :--------------------: | :-----: | :----------: |
|  | `field` | Parameter to return |  | `difficulty` |

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "endpoint": "difficulty"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "chain": "main",
    "blocks": 412022,
    "headers": 665582,
    "bestblockhash": "0000000000000000056482e60e14364c82903764eb88aef8fb0b1b60647334be",
    "difficulty": 194254820283.444,
    "mediantime": 1463406562,
    "verificationprogress": 0.2162006436056612,
    "initialblockdownload": true,
    "chainwork": "0000000000000000000000000000000000000000001973393fcfc0215ecc9726",
    "size_on_disk": 4758448869,
    "pruned": true,
    "pruneheight": 406538,
    "automatic_pruning": true,
    "prune_target_size": 5242880000,
    "softforks": {
      "bip34": {
        "type": "buried",
        "active": true,
        "height": 227931
      },
      "bip66": {
        "type": "buried",
        "active": true,
        "height": 363725
      },
      "bip65": {
        "type": "buried",
        "active": true,
        "height": 388381
      },
      "csv": {
        "type": "buried",
        "active": false,
        "height": 419328
      },
      "segwit": {
        "type": "buried",
        "active": false,
        "height": 481824
      }
    },
    "warnings": "",
    "result": 665582
  },
  "result": 665582,
  "statusCode": 200
}
```

## `scantxoutset` Endpoint

Calls `"method": "scantxoutset"` on the Bitcoin node and returns the total balance of all supplied addresses.

### Input Params

| Required? |    Name    |      Description       | Options | Defaults to  |
| :-------: | :--------: | :--------------------: | :-----: | :----------: |
| ✅ | `scanobjects` | Array of Bitcoin addresses | `addresses` |  |

`scanobjects` is an array of strings of Bitcoin addresses that can be formatted as plain addresses or surrounded by `addr(` and `)`. See example below

### Sample Input

```json
{
  "jobID": "1",
  "data": {
    "endpoint": "scantxoutset",
    "scanobjects": [
      "39e7mxbeNmRRnjfy1qkphv1TiMcztZ8VuE",
      "addr(35ULMyVnFoYaPaMxwHTRmaGdABpAThM4QR)"
    ]
  }
}
```

### Sample Output

```json
{
    "jobRunID": "1",
    "result": 105049.28265606,
    "statusCode": 200,
    "data": {
        "result": 105049.28265606
    }
}
```

## Testing

Testing is dependent on the type of node you're connecting to. You can set a local environment variable `RPC_URL` to point to an RPC connection. Otherwise, the adapter will default to `"http://localhost:8545"`.

RPC Address and Port Defaults:

- BTC: (bitcoind) http://localhost:8332 (btcd) http://localhost:8334

Make sure you run these commands from the ROOT of this monorepo.

```bash
yarn test bitcoin-json-rpc
```
