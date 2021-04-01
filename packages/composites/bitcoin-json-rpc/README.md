# Bitcoin JSON-RPC Blockchain info adapter for Chainlink

- Takes optional connection to RPC endpoint (set via `RPC_URL` environment variable)

## Input Params

Returns blockchain info stats, by calling `"method": "getblockchainfo"`. It relies on `json-rpc` adapter.

- `endpoint`: The parameter to query for. Default: "difficulty"

## Output

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

## Install

Install dependencies

```bash
yarn
```

Set the `RPC_URL` environment variable to your client URL.

## Testing

Testing is dependent on the type of node you're connecting to. You can set a local environment variable `RPC_URL` to point to an RPC connection. Otherwise, the adapter will default to `"http://localhost:8545"`.

RPC Address and Port Defaults:

- BTC: (bitcoind) http://localhost:8332 (btcd) http://localhost:8334

Make sure you run these commands from the ROOT of this monorepo.

```bash
yarn test bitcoin-json-rpc
```
