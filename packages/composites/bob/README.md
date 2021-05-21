# Bob adapter for Chainlink

The adapter provides an interface for retrieving data from the Bitcoin blockchain.

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |       Description       | Options |       Defaults to       |
| :-------: | :-------: | :---------------------: | :-----: | :---------------------: |
|           | `RPC_URL` | Blockchain RPC endpoint |         | `http://localhost:8545` |

Other common `RPC_URL` endpoints:

- bitcoind: http://localhost:8332
- btcd: http://localhost:8334


This composite adapter incorporates the [`json-rpc`](../../sources/json-rpc) adapter by calling `"method": "getblockchainfo"`.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

- `endpoint`: The parameter to query for. Default: "difficulty"

### Input Params

| Required? |    Name    |      Description       | Options | Defaults to  |
| :-------: | :--------: | :--------------------: | :-----: | :----------: |
|    Yes    | `chainID`  | Parameter to query for |         |              |
|    Yes    | `blockNumber`| Parameter to query for |       |              |

### Sample Input

```json
{
  "jobID": "1",
  "data": { 
    "chainId": 1, 
    "blockNumber": 1500000 
  },  
}
```

### Sample Output
# double quote these
```json
{
      "jobRunID": "1",
      "data": {
        "result": "000000000000000000000000000000000000000000000000000000000000000183952d392f9b0059eea94b10d1a095eefb1943ea91595a16c6698757127d4e1c371086374dcad57dab3a0774e9877152e0c5b4a75815a50ea568d649f0e80077"
      },
      "result": "000000000000000000000000000000000000000000000000000000000000000183952d392f9b0059eea94b10d1a095eefb1943ea91595a16c6698757127d4e1c371086374dcad57dab3a0774e9877152e0c5b4a75815a50ea568d649f0e80077",
      "statusCode": 200
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
