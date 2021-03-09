# Chainlink External Adapter for DNSProof

### Input Parameters

| Required? |   Name   |     Description     |             Options              | Defaults to |
| :-------: | :------: | :-----------------: | :------------------------------: | :---------: |
|           | endpoint | The endpoint to use | [dns-proof](#DNS-Proof-Endpoint) |  dns-proof  |

---

## DNS Proof Endpoint

Checks Google DNS and returns whether or not a domain is owned by an Ethereum address

### Input Params

| Required? |   Name    |     Description      | Options | Defaults to |
| :-------: | :-------: | :------------------: | :-----: | :---------: |
|    ✅     | `domain`  | The domain to check  |         |             |
|    ✅     | `address` | The address to check |         |             |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "domain": "www5.infernos.io",
    "address": "0x4d3407ddfdeb3feb4e8a167484701aced7056826"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "278c97ffadb54a5bbb93cfec5f7b5503",
  "data": {
    "Status": 0,
    "TC": false,
    "RD": true,
    "RA": true,
    "AD": false,
    "CD": false,
    "Question": [{ "name": "www5.infernos.io.", "type": 16 }],
    "Answer": [
      {
        "name": "www5.infernos.io.",
        "type": 16,
        "TTL": 17,
        "data": "\"0x2ffb3d72fa6af12af5d378df0697a2bf9f45652e\""
      },
      {
        "name": "www5.infernos.io.",
        "type": 16,
        "TTL": 17,
        "data": "\"0x4d3407ddfdeb3feb4e8a167484701aced7056826\""
      },
      {
        "name": "www5.infernos.io.",
        "type": 16,
        "TTL": 17,
        "data": "\"0xeb9abc589734ce8051f089cf3498e230456a85dd\""
      },
      {
        "name": "www5.infernos.io.",
        "type": 16,
        "TTL": 17,
        "data": "\"0xf75519f611776c22275474151a04183665b7feDe\""
      }
    ],
    "result": true
  },
  "result": true,
  "statusCode": 200
}
```
