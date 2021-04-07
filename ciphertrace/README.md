# Chainlink External Adapter for ciphertrace

### Environment Variables

| Required? |      Name      |                      Description                       | Options | Defaults to |
| :-------: | :------------: | :----------------------------------------------------: | :-----: | :---------: |
|    ✅     | AWS_ACCESS_KEY | An API key that can be obtained from the data provider |         |             |
|    ✅     | AWS_SECRET_KEY | An API key that can be obtained from the data provider |         |             |

---

### Input Parameters

| Required? |   Name   |     Description     |                  Options                   |  Defaults to   |
| :-------: | :------: | :-----------------: | :----------------------------------------: | :------------: |
|           | endpoint | The endpoint to use | [lookup-address](#Lookup-Address-Endpoint) | lookup-address |

---

## Lookup Address Endpoint

Checks if an address has been blacklisted on a specific network

### Input Params

| Required? |       Name       |            Description             | Options | Defaults to |
| :-------: | :--------------: | :--------------------------------: | :-----: | :---------: |
|           |    `network`     | The network the address belongs to |  `ETH`  |    `ETH`    |
|    ✅     | `lookup_address` |       The address to lookup        |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "network": "ETH",
    "lookup_address": "0x514910771af9ca656af840dff83e8264ecf986ca"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "result": false
  },
  "result": false,
  "statusCode": 200
}
```
