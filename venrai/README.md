# Chainlink External Adapter for Venrai

[Venrai](https://venrai.com/)

### Input Parameters

| Required? |   Name   |     Description     |             Options              | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [sanctions](#sanctions-endpoint) | `sanctions` |

---

## Sanctions Endpoint

Checks if an address appears in the OFAC Anti-Terrorism/Anti-Money Laundering list.

### Input Params

| Required? |      Name       |            Description             |                               Options                                |
| :-------: | :-------------: | :--------------------------------: | :------------------------------------------------------------------: |
|    ✅     |    `chainId`    |  The Blockchain ID of the address  | check the [table](#currently-supported-blockchains-by-chainid) below |
|    ✅     | `lookupAddress` | The address of the wallet to check |                                                                      |

### Currently supported blockchains by chainId

| chainId |    Blockchain    |
| :-----: | :--------------: |
|    1    |     Ethereum     |
|   61    | Ethereum Classic |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "chainId": 1,
    "lookupAddress": "0xd882cfc20f52f2599d84b8e8d58c7fb62cfe344b"
  }
}
```

### Sample Output

The result will be `true` if the address belongs to the sanction list, and `false` if otherwise.

```json
{
  "jobRunID": "1",
  "result": false,
  "statusCode": 200,
  "data": {
    "result": false
  }
}
```
