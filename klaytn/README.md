# Chainlink External Adapter for Klaytn

This adapter is built to fulfill Chainlink oracle requests and send transactions to a [Klaytn](https://github.com/klaytn/klaytn) node.

### Environment Variables

| Required? |    Name     |                                             Description                                              | Options |       Defaults to       |
| :-------: | :---------: | :--------------------------------------------------------------------------------------------------: | :-----: | :---------------------: |
|           |     URL     |                            A URL to a JSON-RPC (HTTP RPC) node on Klaytn                             |         | `http://localhost:8551` |
|    ✅     | PRIVATE_KEY | The private key to sign transactions with. Must have fulfillment permissions on the Oracle contract. |         |                         |

---

### Input Parameters
All parameters except for `result` are a Klaytn's contract log event result. Only `address`, `data` and `topics` are used in the klaytn adapter.
Checkout [klay_subscribe](https://docs.klaytn.com/bapp/json-rpc/api-references/klay/filter#klay_subscribe) to find out how to get the input.
Checkout [Log](https://github.com/klaytn/klaytn/blob/fc20575aba97f4180750a12f50fabcbbbf3d2f96/blockchain/types/log.go#L36-L61) for the log event result structure.
| Required? |        Name         |                                 Description                                  | Options | Defaults to |
| :-------: | :-----------------: | :--------------------------------------------------------------------------: | :-----: | :---------: |
|    ✅     |      `address`      |                The oracle contract to fulfill the request on                 |         |             |
|    ✅     |       `data`        | The data that contains functionSelector and dataPrefix prefix in the request |         |             |
|    ✅     |      `topics`       |                      The fulfillment function selector                       |         |             |
|    ✅     | `result` or `value` |                    The value to fulfill the request with                     |         |             |

---

### Sample Input
```json
{
   "id":"f645e8e383824130b286bd38b52f2c1b",
   "data":{
      "address":"0xf1e73a60687affcb1d6308fcb2ef1da3865ff797",
      "blockHash":"0x9812333b88f7f455806c44151d5647c1f704bc43c6692daf445b913e1ace2639",
      "blockNumber":"0x32e1a43",
      "data":"0x000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3e2518ce623a09e42cbf938c0c32fd96409eb870f6a7ffc23765732ca2a4e04b95000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3ed204b3fb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060418e02000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000000000001000000000000000000000000000000000000000000000000000000000000000000",
      "logIndex":"0x3",
      "result":"10043045",
      "topics":[
         "0xd8d7ecc4800d25fa53ce0372f13a416d98907a7ef3d8d3bdd79cf4fe75529c65",
         "0x3836643062336366366262313466306338633237363234316636383361363765"
      ],
      "transactionHash":"0xb8d968d5ea8916ff8faac37419ad054ad69417d0b275e3a52bd7854801d3188d",
      "transactionIndex":"0x0"
   }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "data":{
    "blockHash":"0x1d8da44f669282e08c4e2eb11e5d45581df6cc3edfbf6c53f8bd52b8c4bb134c",
    "blockNumber":"0x32e1bb0",
    "contractAddress":null,
    "from":"0x50c82047a414d2aad88ae67a5f02c311d2d86e69",
    "gas":"0x16e360",
    "gasPrice":"0x5d21dba00",
    "gasUsed":"0xa360",
    "input":"0x4ab0d190f81242d0126a05e9d7f344b6a56e99963cf58fbb01afd44aa1a690f35caa5dc8000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000344d20e71a76b5a44fff62438cd17446a331bf3ed204b3fb000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000060418f6d000000000000000000000000000000000000000000000000000000000099561c",
    "logs":[
      {
        "address":"0x344d20e71a76b5a44fff62438cd17446a331bf3e",
        "topics":[
          "0x7cc135e0cebb02c3480ae5d74d377283180a2601f8f644edf7987b009316c63a",
          "0xf81242d0126a05e9d7f344b6a56e99963cf58fbb01afd44aa1a690f35caa5dc8"
        ],
        "data":"0x",
        "blockNumber":"0x32e1bb0",
        "transactionHash":"0xac4a86193701cdb2f6cf8af723e4c4693e777a3e08f4b439b9f7268266323e50",
        "transactionIndex":"0x0",
        "blockHash":"0x1d8da44f669282e08c4e2eb11e5d45581df6cc3edfbf6c53f8bd52b8c4bb134c",
        "logIndex":"0x0",
        "removed":false
      }
    ],
    "logsBloom":"0x00000000000000000000000000000000000000000000000000000000000000000000100000000000000000000000000000000000000000000000000000400000000000000000000000000000008000000000000200000000000000000000000000000000000000000000000000000004000000000000000000000000000100000000000000000000040000000000000000000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000800000000000000000000000000000000000000000000000000000000000000",
    "nonce":"0x5fc",
    "senderTxHash":"0xac4a86193701cdb2f6cf8af723e4c4693e777a3e08f4b439b9f7268266323e50",
    "signatures":[
      {
        "V":"0x7f6",
        "R":"0xa080471c4beb679d3da9ea98a10c37149049f0c3c483c137c188340fc9c756f4",
        "S":"0x7aad86bd02bfdd42165efce5dae50c4e2b92f7681761c7161b258d8830d039cd"
      }
    ],
    "status":"0x1",
    "to":"0xf1e73a60687affcb1d6308fcb2ef1da3865ff797",
    "transactionHash":"0xac4a86193701cdb2f6cf8af723e4c4693e777a3e08f4b439b9f7268266323e50",
    "transactionIndex":"0x0",
    "type":"TxTypeLegacyTransaction",
    "typeInt":0,
    "value":"0x0",
    "result":"0xac4a86193701cdb2f6cf8af723e4c4693e777a3e08f4b439b9f7268266323e50"
  },
  "result":"0xac4a86193701cdb2f6cf8af723e4c4693e777a3e08f4b439b9f7268266323e50",
  "status":200
}
```
