# Chainlink External Adapter for Alpine

This adapter gets the tvl of Ethereum vaults as well as the block numbers of the last cross chain transfers.

### Environment Variables

| Required? |        Name         |         Description          | Options | Defaults to |
| :-------: | :-----------------: | :--------------------------: | :-----: | :---------: |
|           | {network}\_RPC_URL  | RPC url for Ethereum/Polygon |         |             |
|           | {network}\_CHAIN_ID |  The chain id to connect to  |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                        Options                         | Defaults to |
| :-------: | :------: | :-----------------: | :----------------------------------------------------: | :---------: |
|    ✅     | endpoint | The endpoint to use | [tvl](#TVL-Endpoint), [lastBlock](#LastBlock-Endpoint) |     tvl     |
|    ✅     | network  |     The network     |             Etiher "ETHEREUM" or "POLYGON"             |  ETHEREUM   |

---

## TVL Endpoint

This gets the tvl of a vault on Ethereum

### Input Params

| Required? |      Name      |            Description            | Options | Defaults to |
| :-------: | :------------: | :-------------------------------: | :-----: | :---------: |
|    ✅     | `vaultAddress` | The address of the vault contract |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "vaultAddress": "0xA0F3BC193651c902C0cae9779c6E7F10761bF2Ac",
    "endpoint": "tvl",
    "network": "ETHEREUM"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": "100000"
  },
  "statusCode": 200
}
```

## LastBlock Endpoint

This gets the lastblock of a cross chain transfer from the given chain

### Input Params

| Required? |       Name       |             Description             | Options | Defaults to |
| :-------: | :--------------: | :---------------------------------: | :-----: | :---------: |
|    ✅     | `stagingAddress` | The address of the staging contract |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "stagingAddress": "0xd5c81d46D8237b06fa6110aEB43363b6F63bC247",
    "endpoint": "lastblock",
    "network": "POLYGON"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": "21170874"
  },
  "statusCode": 200
}
```
