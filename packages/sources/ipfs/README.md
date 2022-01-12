# Chainlink External Adapter for IPFS

An adapter to read and write data from IPFS

### Environment Variables

| Required? |     Name     |                Description                | Options |       Defaults to       |
| :-------: | :----------: | :---------------------------------------: | :-----: | :---------------------: |
|           | API_ENDPOINT | The URL for your IPFS node's API endpoint |         | `http://127.0.0.1:5001` |

---

### Input Parameters

| Required? |   Name   |     Description      |                     Options                      | Defaults to |
| :-------: | :------: | :------------------: | :----------------------------------------------: | :---------: |
|           | endpoint | The endpoint to call | [read](#Read-Endpoint), [write](#Write-Endpoint) |    read     |

---

## Read Endpoint

Read data from IPFS

### Input Params

| Required? | Name  |                          Description                           |    Options     | Defaults to |
| :-------: | :---: | :------------------------------------------------------------: | :------------: | :---------: |
|           |  cid  |          The CID to read. Required if IPNS is not set          |                |             |
|           | ipns  |          The IPNS to read. Required if CID is not set          |                |             |
|           | codec | The codec to convert the data, if necessary when type is "raw" | json, dag-cbor |             |
|           | type  |                    The type of data to read                    |    raw, dag    |     raw     |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "cid": "QmWFam9NBVVhz3fViSbxjB7utkkjDSmdWWBbbSTkK8kaxk",
    "codec": "dag-cbor"
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": {
    "id": 123,
    "name": "my object"
  },
  "statusCode": 200,
  "data": {
    "result": {
      "id": 123,
      "name": "my object"
    }
  }
}
```

## Write Endpoint

Write data to IPFS

### Input Params

| Required? |    Name    |                          Description                           |    Options     | Defaults to |
| :-------: | :--------: | :------------------------------------------------------------: | :------------: | :---------: |
|    ✅     |    data    |                       The data to write                        |                |             |
|           |   codec    | The codec to convert the data, if necessary when type is "raw" | json, dag-cbor |             |
|           | cidVersion |                 The CID version to be returned                 |                |      0      |
|           |    type    |                   The type of data to write                    |    raw, dag    |     raw     |
|           |   format   |                     The DAG format to use                      |                |  dag-cbor   |
|           |   format   |                The DAG hashing algorithm to use                |                |  sha2-256   |

### Sample Input

```json
{
  "id": "1",
  "data": {
    "endpoint": "write",
    "data": {
      "name": "my object",
      "id": 123
    },
    "codec": "json",
    "cidVersion": 1
  }
}
```

### Sample Output

```json
{
  "jobRunID": "1",
  "result": "bafkreidrjtjrjwi2b7do4e74gbome3lwtm7adpouwjfmganrpw7ykfl5a4",
  "statusCode": 200,
  "data": {
    "result": "bafkreidrjtjrjwi2b7do4e74gbome3lwtm7adpouwjfmganrpw7ykfl5a4"
  }
}
```
