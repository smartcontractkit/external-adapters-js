# Bob adapter for Chainlink

The adapter provides an interface for retrieving data from the source blockchain.

## Configuration

The adapter takes the following environment variables:

| Required? |   Name    |       Description       | Options |       Defaults to       |
| :-------: | :-------: | :---------------------: | :-----: | :---------------------: |
|     No      | `RPC_URL` | Blockchain RPC endpoint |         | `http://localhost:8545` |

This composite adapter incorporates the [`json-rpc`](../../sources/json-rpc) adapter by calling `"method": "getblockchainfo"`.

## Running

See the [Composite Adapter README](../README.md) for more information on how to get started.

---

## Endpoints
- `endpoint`: The parameter to query for. Default: "format"
- Currently, there is only one "endpoint:" format. This adapter was designed so that adding new internal endpoints would be easy to implement.

### Format Endpoint:
The format endpoint encodes the chainId, block hash, and block receiptsRoot as bytes and returns that without a 0x prefix.
---

### Input Params

| Required? |    Name    |      Description       | Options | Defaults to  |
| :-------: | :--------: | :--------------------: | :-----: | :----------: |
|    Yes    | `chainID`  | An identifier for which network of the blockchain to use |         |              |
|    Yes    | `blockNumber`| Block number to query for |       |              |
|     No    | `url` | Blockchain RPC endpoint |         | `http://localhost:8545` |

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

Make sure you run these commands from the ROOT of this monorepo.

```bash
yarn test bob-adapter
```
