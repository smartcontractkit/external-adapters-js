# Chainlink External Adapter for Klaytn

This adapter is built to fulfill Chainlink oracle requests and send transactions to a [Klaytn](https://github.com/klaytn/klaytn) node.

### Environment Variables

| Required? |    Name     |                                             Description                                              | Options |       Defaults to       |
| :-------: | :---------: | :--------------------------------------------------------------------------------------------------: | :-----: | :---------------------: |
|           |     URL     |                            A URL to a JSON-RPC (HTTP RPC) node on Klaytn                             |         | `http://localhost:8551` |
|    ✅     | PRIVATE_KEY | The private key to sign transactions with. Must have fulfillment permissions on the Oracle contract. |         |                         |

---

### Input Parameters

| Required? |        Name         |                                 Description                                  | Options | Defaults to |
| :-------: | :-----------------: | :--------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |      `address`      |                The oracle contract to fulfill the request on                 |         |             |
|    ✅     |       `data`        | The data that contains functionSelector and dataPrefix prefix in the request |         |             |
|    ✅     |      `topics`       |                      The fulfillment function selector                       |         |             |
|    ✅     | `result` or `value` |                    The value to fulfill the request with                     |         |             |

---

### Sample Input

### Sample Output

```json
{
  "jobRunID": "1",
  "data": {
    "result": "0xf5e2f6cf458ba8aa2676458888bff34536954dfb1e6aa02523d0c1143112761c"
  },
  "result": "0xf5e2f6cf458ba8aa2676458888bff34536954dfb1e6aa02523d0c1143112761c",
  "statusCode": 200
}
```
